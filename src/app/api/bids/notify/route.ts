import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { appendAuditEntry } from "@/lib/audit";

// POST /api/bids/notify — fire-and-forget email send
// Called internally after bid submission
export async function POST(request: NextRequest) {
  try {
    const { bid_id } = await request.json();
    if (!bid_id) {
      return NextResponse.json(
        { error: "Missing bid_id" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch bid + contract data
    const { data: bid } = await supabase
      .from("bids")
      .select("*, contracts(*)")
      .eq("id", bid_id)
      .single();

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.warn("RESEND_API_KEY not configured — skipping email");
      return NextResponse.json({ sent: false, reason: "no_api_key" });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "casey@dwtb.dev";

    // Email to Casey
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "DWTB?! Studios <bids@dwtb.dev>",
          to: [adminEmail],
          subject: `New Bid: $${Number(bid.bid_amount).toLocaleString()} from ${bid.bidder_company}`,
          text: [
            `New bid submitted for ${bid.contract_version}`,
            ``,
            `Bidder: ${bid.bidder_name}`,
            `Title: ${bid.bidder_title}`,
            `Company: ${bid.bidder_company}`,
            `Email: ${bid.bidder_email}`,
            `Amount: $${Number(bid.bid_amount).toLocaleString()}`,
            `Status: ${bid.status}`,
            `Note: ${bid.note || "(none)"}`,
            ``,
            `Bid ID: ${bid.id}`,
            `Submitted: ${bid.created_at}`,
          ].join("\n"),
        }),
      });
    } catch (error) {
      await appendAuditEntry({
        eventType: "email_delivery_failed",
        entityType: "bid",
        entityId: bid_id,
        actorEmail: adminEmail,
        payload: { target: "admin", error: String(error) },
      });
    }

    // Email to bidder
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
            `Contract Version: ${bid.contract_version}`,
            `Submitted: ${bid.created_at}`,
            ``,
            `You will be notified when your bid status changes.`,
            ``,
            `— Casey Glarkin, DWTB?! Studios`,
          ].join("\n"),
        }),
      });

      // Mark notification as sent
      await supabase
        .from("bids")
        .update({ notification_sent: true })
        .eq("id", bid_id);
    } catch (error) {
      await appendAuditEntry({
        eventType: "email_delivery_failed",
        entityType: "bid",
        entityId: bid_id,
        actorEmail: bid.bidder_email,
        payload: { target: "bidder", error: String(error) },
      });
    }

    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json(
      { error: "Notification failed" },
      { status: 500 }
    );
  }
}
