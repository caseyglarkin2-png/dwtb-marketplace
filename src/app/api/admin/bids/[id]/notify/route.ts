import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { appendAuditEntry } from "@/lib/audit";
import { getLeadById, extractBidRecord } from "@/lib/clawd";

// POST /api/admin/bids/[id]/notify — resend notification for a specific bid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bidId } = await params;

  let bid;
  try {
    const lead = await getLeadById(bidId);
    bid = extractBidRecord(lead);
  } catch {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 503 }
    );
  }

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
        subject: `Allocation Confirmation — DWTB?! Studios Q2 2026`,
        text: [
          `${bid.bidder_name},`,
          ``,
          `Your allocation request has been received.`,
          ``,
          `Amount: $${Number(bid.bid_amount).toLocaleString()}`,
          `Reference: ${bid.bid_id}`,
          `Status: ${bid.status}`,
          ``,
          `— Casey Glarkin, DWTB?! Studios`,
        ].join("\n"),
      }),
    });

    await appendAuditEntry({
      eventType: "email_sent",
      entityType: "bid",
      entityId: bidId,
      payload: { action: "admin_resend" },
    });

    return NextResponse.json({ sent: true });
  } catch (error) {
    await appendAuditEntry({
      eventType: "email_delivery_failed",
      entityType: "bid",
      entityId: bidId,
      payload: { action: "admin_resend", error: String(error) },
    });
    return NextResponse.json(
      { error: "Email send failed" },
      { status: 500 }
    );
  }
}
