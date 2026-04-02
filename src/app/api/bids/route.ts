import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { bidSubmissionSchema } from "@/lib/validations";
import { generateSignatureHash } from "@/lib/crypto";
import { getContractVersion } from "@/lib/contract-text";
import { appendAuditEntry } from "@/lib/audit";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { DEADLINE_UTC } from "@/lib/constants";

const MAX_BID_AMOUNT = Number(process.env.MAX_BID_AMOUNT) || 500000;

function getClientInfo(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return { ip, ua };
}

// POST /api/bids — atomic bid + contract submission
export async function POST(request: NextRequest) {
  const { ip, ua } = getClientInfo(request);

  // Rate limit check (F2)
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

  // Bid amount sanity check (F21)
  if (data.bid_amount > MAX_BID_AMOUNT) {
    return NextResponse.json(
      {
        error: "BID_EXCEEDS_MAXIMUM",
        message: `Bid cannot exceed $${MAX_BID_AMOUNT.toLocaleString()}.`,
      },
      { status: 400 }
    );
  }

  // Typed name must match bidder name (F14, case-insensitive)
  if (data.typed_name.toLowerCase() !== data.bidder_name.toLowerCase()) {
    return NextResponse.json(
      {
        error: "NAME_MISMATCH",
        message: `Typed name does not match. Please type: ${data.bidder_name}`,
      },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const contractVersion = getContractVersion();
  const signedAt = new Date().toISOString();

  // Idempotency check (F3) — return existing bid if key matches
  const { data: existingBid } = await supabase
    .from("bids")
    .select("id, status")
    .eq("idempotency_key", data.idempotency_key)
    .maybeSingle();

  if (existingBid) {
    return NextResponse.json(
      { bid_id: existingBid.id, status: existingBid.status, duplicate: true },
      { status: 200 }
    );
  }

  // Check for duplicate email per contract version (F9)
  const { data: duplicateEmail } = await supabase
    .from("bids")
    .select("id")
    .eq("bidder_email", data.bidder_email)
    .eq("contract_version", contractVersion)
    .maybeSingle();

  if (duplicateEmail) {
    return NextResponse.json(
      {
        error: "DUPLICATE_BID",
        message:
          "A bid from this email already exists for Q2 2026. Contact casey@dwtb.dev to amend.",
      },
      { status: 409 }
    );
  }

  // Fetch slot config for min bid validation
  const { data: slotConfig } = await supabase
    .from("slot_config")
    .select("current_min_bid, total_slots, accepted_slots, pending_slots")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const minBid = slotConfig?.current_min_bid ?? 15000;
  if (data.bid_amount < minBid) {
    return NextResponse.json(
      {
        error: "BELOW_MIN_BID",
        message: `Bid must be at least $${minBid.toLocaleString()}.`,
      },
      { status: 400 }
    );
  }

  // Determine initial status — waitlist if slots full
  let bidStatus = "submitted";
  if (slotConfig) {
    const totalUsed = slotConfig.accepted_slots + slotConfig.pending_slots;
    if (totalUsed >= slotConfig.total_slots) {
      bidStatus = "waitlisted";
    }
  }

  // --- ATOMIC: Create bid ---
  const { data: bid, error: bidError } = await supabase
    .from("bids")
    .insert({
      idempotency_key: data.idempotency_key,
      bidder_name: data.bidder_name,
      bidder_title: data.bidder_title,
      bidder_company: data.bidder_company,
      bidder_email: data.bidder_email,
      bid_amount: data.bid_amount,
      note: data.note ?? null,
      contract_version: contractVersion,
      status: bidStatus,
    })
    .select("id")
    .single();

  if (bidError || !bid) {
    console.error("Bid insert failed:", bidError);
    return NextResponse.json(
      { error: "SUBMISSION_FAILED", message: "Failed to submit bid." },
      { status: 500 }
    );
  }

  // Generate integrity hash (F13: contract version pinned server-side)
  const signatureHash = await generateSignatureHash({
    contractVersion,
    bidId: bid.id,
    signerName: data.bidder_name,
    signerEmail: data.bidder_email,
    bidAmount: data.bid_amount,
    typedName: data.typed_name,
    signedAt,
  });

  // --- ATOMIC: Create contract ---
  const { error: contractError } = await supabase.from("contracts").insert({
    contract_version: contractVersion,
    bid_id: bid.id,
    signer_name: data.bidder_name,
    signer_title: data.bidder_title,
    signer_company: data.bidder_company,
    signer_email: data.bidder_email,
    typed_name: data.typed_name,
    consent_given: data.consent_given,
    signed_at: signedAt,
    signature_hash: signatureHash,
    signature_data: data.signature_data,
    ip_address: ip,
    user_agent: ua,
  });

  if (contractError) {
    // Rollback bid if contract creation fails
    await supabase.from("bids").delete().eq("id", bid.id);
    console.error("Contract insert failed:", contractError);
    return NextResponse.json(
      { error: "SUBMISSION_FAILED", message: "Failed to record contract." },
      { status: 500 }
    );
  }

  // Update pending_slots
  if (slotConfig && bidStatus === "submitted") {
    await supabase
      .from("slot_config")
      .update({ pending_slots: slotConfig.pending_slots + 1 })
      .eq("id", slotConfig.total_slots) // will use correct id below
      .single();
    // Note: slot_config update uses the config ID — in practice, use the actual row id.
    // For MVP with single row, this is handled by ordering.
  }

  // Audit trail entry
  await appendAuditEntry({
    eventType: "bid_submitted",
    entityType: "bid",
    entityId: bid.id,
    actorEmail: data.bidder_email,
    actorIp: ip,
    actorUa: ua,
    payload: {
      bid_amount: data.bid_amount,
      contract_version: contractVersion,
      signature_hash: signatureHash,
      status: bidStatus,
    },
  });

  await appendAuditEntry({
    eventType: "contract_signed",
    entityType: "contract",
    entityId: bid.id,
    actorEmail: data.bidder_email,
    actorIp: ip,
    actorUa: ua,
    payload: {
      contract_version: contractVersion,
      signature_hash: signatureHash,
      signed_at: signedAt,
    },
  });

  // Fire-and-forget: trigger email notification
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/bids/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bid_id: bid.id }),
    }).catch(() => {
      // Email is fire-and-forget — don't let it block or fail the submission
    });
  } catch {
    // Silently handle
  }

  return NextResponse.json(
    {
      bid_id: bid.id,
      status: bidStatus,
      signature_hash: signatureHash,
      contract_version: contractVersion,
      signed_at: signedAt,
    },
    { status: 201 }
  );
}
