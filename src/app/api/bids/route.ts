import { NextRequest, NextResponse } from "next/server";
import { bidSubmissionSchema } from "@/lib/validations";
import { generateSignatureHash } from "@/lib/crypto";
import { getContractVersion } from "@/lib/contract-text";
import { appendAuditEntry } from "@/lib/audit";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { DEADLINE_UTC, DEFAULT_MIN_BID } from "@/lib/constants";
import { createLead } from "@/lib/clawd";

const MAX_BID_AMOUNT = Number(process.env.MAX_BID_AMOUNT) || 500000;

function getClientInfo(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return { ip, ua };
}

// POST /api/bids — bid + contract submission (email-based record)
export async function POST(request: NextRequest) {
  const { ip, ua } = getClientInfo(request);

  // Rate limit check
  const rlKey = rateLimitKey(ip, ua);
  const { allowed, retryAfter } = await checkRateLimit(rlKey);
  if (!allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many requests. Try again later." },
      {
        status: 429,
        headers: retryAfter
          ? { "Retry-After": String(Math.ceil(retryAfter / 1000)) }
          : {},
      }
    );
  }

  // Server-side deadline enforcement
  const deadline = new Date(DEADLINE_UTC);
  if (new Date() >= deadline) {
    return NextResponse.json(
      { error: "DEADLINE_PASSED", message: "The bid window has closed." },
      { status: 403 }
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = bidSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Bid amount sanity check
  if (data.bid_amount > MAX_BID_AMOUNT) {
    return NextResponse.json(
      {
        error: "BID_EXCEEDS_MAXIMUM",
        message: `Bid cannot exceed $${MAX_BID_AMOUNT.toLocaleString()}.`,
      },
      { status: 400 }
    );
  }

  // Min bid check
  if (data.bid_amount < DEFAULT_MIN_BID) {
    return NextResponse.json(
      {
        error: "BELOW_MIN_BID",
        message: `Bid must be at least $${DEFAULT_MIN_BID.toLocaleString()}.`,
      },
      { status: 400 }
    );
  }

  // Typed name must match bidder name (case-insensitive)
  if (data.typed_name.toLowerCase() !== data.bidder_name.toLowerCase()) {
    return NextResponse.json(
      {
        error: "NAME_MISMATCH",
        message: `Typed name does not match. Please type: ${data.bidder_name}`,
      },
      { status: 400 }
    );
  }

  const contractVersion = getContractVersion();
  const signedAt = new Date().toISOString();

  // Submit to Clawd as a lead
  let bidId: string;
  try {
    const clawdRes = await createLead({
      name: data.bidder_name,
      email: data.bidder_email,
      company: data.bidder_company,
      source: "dwtb_marketplace",
      intent: "bid",
      meta: {
        bid_amount: data.bid_amount,
        bidder_title: data.bidder_title,
        note: data.note,
        contract_version: contractVersion,
        signed_at: signedAt,
      },
    });
    bidId = clawdRes.lead.id;
  } catch (err) {
    console.error("Clawd lead creation failed:", err);
    return NextResponse.json(
      { error: "SUBMISSION_FAILED", message: "Failed to submit bid. Please try again." },
      { status: 502 }
    );
  }

  // Generate integrity hash
  const signatureHash = await generateSignatureHash({
    contractVersion,
    bidId,
    signerName: data.bidder_name,
    signerEmail: data.bidder_email,
    bidAmount: data.bid_amount,
    typedName: data.typed_name,
    signedAt,
  });

  // Audit trail
  await appendAuditEntry({
    eventType: "bid_submitted",
    entityType: "bid",
    entityId: bidId,
    actorEmail: data.bidder_email,
    actorIp: ip,
    actorUa: ua,
    payload: {
      bid_amount: data.bid_amount,
      contract_version: contractVersion,
      signature_hash: signatureHash,
      bidder_name: data.bidder_name,
      bidder_company: data.bidder_company,
    },
  });

  await appendAuditEntry({
    eventType: "contract_signed",
    entityType: "contract",
    entityId: bidId,
    actorEmail: data.bidder_email,
    actorIp: ip,
    actorUa: ua,
    payload: {
      contract_version: contractVersion,
      signature_hash: signatureHash,
      signed_at: signedAt,
    },
  });

  // Send emails inline (fire-and-forget)
  sendBidEmails({
    bidId,
    bidderName: data.bidder_name,
    bidderTitle: data.bidder_title,
    bidderCompany: data.bidder_company,
    bidderEmail: data.bidder_email,
    bidAmount: data.bid_amount,
    note: data.note,
    contractVersion,
    signedAt,
  }).catch(console.error);

  return NextResponse.json(
    {
      bid_id: bidId,
      status: "submitted",
      signature_hash: signatureHash,
      contract_version: contractVersion,
      signed_at: signedAt,
    },
    { status: 201 }
  );
}

async function sendBidEmails(bid: {
  bidId: string;
  bidderName: string;
  bidderTitle: string;
  bidderCompany: string;
  bidderEmail: string;
  bidAmount: number;
  note?: string;
  contractVersion: string;
  signedAt: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY not configured — skipping email");
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || "casey@dwtb.dev";

  // Email to Casey
  try {
    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DWTB?! Studios <bids@dwtb.dev>",
        to: [adminEmail],
        subject: `New Bid: $${bid.bidAmount.toLocaleString()} from ${bid.bidderCompany}`,
        text: [
          `New bid submitted for ${bid.contractVersion}`,
          ``,
          `Bidder: ${bid.bidderName}`,
          `Title: ${bid.bidderTitle}`,
          `Company: ${bid.bidderCompany}`,
          `Email: ${bid.bidderEmail}`,
          `Amount: $${bid.bidAmount.toLocaleString()}`,
          `Note: ${bid.note || "(none)"}`,
          ``,
          `Bid ID: ${bid.bidId}`,
          `Submitted: ${bid.signedAt}`,
        ].join("\n"),
      }),
    });
    if (!adminRes.ok) {
      console.error("Admin notification email failed:", adminRes.status, await adminRes.text().catch(() => ""));
    }
  } catch (error) {
    console.error("Admin notification email failed:", error);
  }

  // Email to bidder
  try {
    const bidderRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DWTB?! Studios <bids@dwtb.dev>",
        to: [bid.bidderEmail],
        subject: `Bid Confirmation — DWTB?! Studios Q2 2026`,
        text: [
          `${bid.bidderName},`,
          ``,
          `Your bid has been received.`,
          ``,
          `Amount: $${bid.bidAmount.toLocaleString()}`,
          `Reference: ${bid.bidId}`,
          `Contract Version: ${bid.contractVersion}`,
          `Submitted: ${bid.signedAt}`,
          ``,
          `You will be notified when your bid status changes.`,
          ``,
          `— Casey Glarkin, DWTB?! Studios`,
        ].join("\n"),
      }),
    });
    if (!bidderRes.ok) {
      console.error("Bidder confirmation email failed:", bidderRes.status, await bidderRes.text().catch(() => ""));
    }
  } catch (error) {
    console.error("Bidder confirmation email failed:", error);
  }
}
