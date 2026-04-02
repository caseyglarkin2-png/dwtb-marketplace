import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { appendAuditEntry } from "@/lib/audit";
import {
  getBid,
  updateBid,
  toBidRecord,
} from "@/lib/clawd";
import { renderContractText } from "@/lib/contract-text";
import {
  generateContractPdf,
  generatePaymentInstructionsPdf,
} from "@/lib/pdf";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "declined", "waitlisted"],
  submitted: ["accepted", "declined", "waitlisted"],
  waitlisted: ["accepted", "declined"],
  accepted: ["paid", "declined"],
  paid: ["onboarded"],
  declined: [],
};

// PATCH /api/admin/bids/[id]/status — admin status transition
// On "accepted": emails bidder with signed contract PDF + payment instructions PDF
// On "paid": Casey manually marks payment received
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bidId } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const newStatus = body.status;
  if (!newStatus || typeof newStatus !== "string") {
    return NextResponse.json({ error: "Status required" }, { status: 400 });
  }

  // Fetch current bid from Clawd marketplace API
  let clawdBid;
  try {
    clawdBid = await getBid(bidId);
  } catch {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  const bid = toBidRecord(clawdBid);

  // Validate transition
  const allowedNext = VALID_TRANSITIONS[bid.status];
  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return NextResponse.json(
      {
        error: "INVALID_TRANSITION",
        message: `Cannot transition from '${bid.status}' to '${newStatus}'`,
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  // Persist status update to Clawd
  const updated = await updateBid(bidId, { status: newStatus });
  console.log(`[Admin] Bid ${bidId}: ${bid.status} → ${newStatus}`);

  // Audit trail
  appendAuditEntry({
    eventType: newStatus === "accepted"
      ? "bid_accepted"
      : newStatus === "declined"
        ? "bid_declined"
        : newStatus === "paid"
          ? "contract_signed"
          : "bid_waitlisted",
    entityType: "bid",
    entityId: bidId,
    payload: {
      previous_status: bid.status,
      new_status: newStatus,
    },
  });

  // Send status change email to bidder (fire-and-forget)
  if (newStatus === "accepted") {
    sendAcceptanceEmail(bid, now).catch(console.error);
  } else {
    sendStatusEmail(bid, newStatus).catch(console.error);
  }

  return NextResponse.json({
    bid_id: bidId,
    previous_status: bid.status,
    new_status: newStatus,
  });
}

// On acceptance: email signed contract PDF + payment instructions PDF
async function sendAcceptanceEmail(
  bid: {
    bid_id: string;
    bidder_email: string;
    bidder_name: string;
    bidder_company: string;
    bidder_title: string;
    bid_amount: number;
    contract_version: string;
    signature_hash: string;
    signed_at: string;
  },
  acceptedAt: string
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  // Generate contract PDF
  const contractText = renderContractText({
    bidderName: bid.bidder_name,
    bidderTitle: bid.bidder_title,
    bidderCompany: bid.bidder_company,
    bidAmount: bid.bid_amount,
    date: new Date(bid.signed_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  const contractPdf = generateContractPdf({
    contractText,
    bidderName: bid.bidder_name,
    bidderCompany: bid.bidder_company,
    bidAmount: bid.bid_amount,
    signedAt: bid.signed_at,
    bidId: bid.bid_id,
    signatureHash: bid.signature_hash,
    contractVersion: bid.contract_version,
  });

  // Generate payment instructions PDF
  const paymentPdf = generatePaymentInstructionsPdf({
    bidderName: bid.bidder_name,
    bidderCompany: bid.bidder_company,
    bidAmount: bid.bid_amount,
    bidId: bid.bid_id,
    contractVersion: bid.contract_version,
    acceptedAt,
  });

  const halfAmount = Math.round(bid.bid_amount / 2).toLocaleString();

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DWTB?! Studios <bids@dwtb.dev>",
        to: [bid.bidder_email],
        subject: "Allocation Accepted — DWTB?! Studios Q2 2026",
        text: [
          `${bid.bidder_name},`,
          "",
          "Your allocation request has been accepted.",
          "",
          "Attached you'll find:",
          "  1. Your signed contract (PDF)",
          "  2. Payment instructions with accepted methods",
          "",
          "Payment Schedule:",
          `  Installment 1: $${halfAmount} — due within 7 business days`,
          `  Installment 2: $${halfAmount} — due by May 15, 2026`,
          "",
          "Accepted methods: Zelle, Venmo, or wire transfer.",
          "Details are in the attached payment instructions.",
          "",
          "Casey will be in touch within 24 hours to confirm onboarding details.",
          "",
          `Reference: ${bid.bid_id}`,
          "",
          "— Casey Glarkin, DWTB?! Studios",
        ].join("\n"),
        attachments: [
          {
            filename: `DWTB-Contract-${bid.bid_id.slice(0, 8)}.pdf`,
            content: Buffer.from(contractPdf).toString("base64"),
          },
          {
            filename: `DWTB-Payment-Instructions-${bid.bid_id.slice(0, 8)}.pdf`,
            content: Buffer.from(paymentPdf).toString("base64"),
          },
        ],
      }),
    });
  } catch (error) {
    console.error("Acceptance email failed:", error);
    appendAuditEntry({
      eventType: "email_delivery_failed",
      entityType: "bid",
      entityId: bid.bid_id,
      payload: { status: "accepted", error: String(error) },
    });
  }
}

async function sendStatusEmail(
  bid: {
    bid_id: string;
    bidder_email: string;
    bidder_name: string;
    bidder_company: string;
    bid_amount: number;
  },
  newStatus: string
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const statusCopy: Record<string, { subject: string; body: string }> = {
    declined: {
      subject: "Allocation Update — DWTB?! Studios Q2 2026",
      body: `${bid.bidder_name},\n\nYour allocation request was not selected for Q2. DWTB?! Studios will be running a limited Q3 window. Watch for an invite.\n\nReference: ${bid.bid_id}\n\n— Casey Glarkin, DWTB?! Studios`,
    },
    waitlisted: {
      subject: "Allocation Waitlisted — DWTB?! Studios Q2 2026",
      body: `${bid.bidder_name},\n\nYour allocation request is on the waitlist. If a slot opens before April 6, you will hear from us immediately.\n\nReference: ${bid.bid_id}\n\n— Casey Glarkin, DWTB?! Studios`,
    },
    paid: {
      subject: "Payment Received — DWTB?! Studios Q2 2026",
      body: `${bid.bidder_name},\n\nPayment has been received and confirmed. Onboarding details are coming within 48 hours.\n\nReference: ${bid.bid_id}\n\n— Casey Glarkin, DWTB?! Studios`,
    },
  };

  const copy = statusCopy[newStatus];
  if (!copy) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DWTB?! Studios <bids@dwtb.dev>",
        to: [bid.bidder_email],
        subject: copy.subject,
        text: copy.body,
      }),
    });
  } catch (error) {
    console.error("Status email failed:", error);
    appendAuditEntry({
      eventType: "email_delivery_failed",
      entityType: "bid",
      entityId: bid.bid_id,
      payload: { status: newStatus, error: String(error) },
    });
  }
}
