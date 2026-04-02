import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { appendAuditEntry } from "@/lib/audit";

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
  const supabase = createServiceClient();

  const { data: bid } = await supabase
    .from("bids")
    .select("*")
    .eq("id", bidId)
    .single();

  if (!bid) {
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
        subject: `Bid Confirmation — DWTB?! Studios Q2 2026`,
        text: [
          `${bid.bidder_name},`,
          ``,
          `Your bid has been received.`,
          ``,
          `Amount: $${Number(bid.bid_amount).toLocaleString()}`,
          `Reference: ${bid.id}`,
          `Status: ${bid.status}`,
          ``,
          `— Casey Glarkin, DWTB?! Studios`,
        ].join("\n"),
      }),
    });

    await supabase
      .from("bids")
      .update({ notification_sent: true })
      .eq("id", bidId);

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
