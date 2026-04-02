import { NextRequest, NextResponse } from "next/server";

// POST /api/bids/notify — send bid confirmation emails
// Accepts bid data directly in request body (no DB lookup)
export async function POST(request: NextRequest) {
  try {
    const bid = await request.json();
    if (!bid?.bidder_email || !bid?.bid_amount) {
      return NextResponse.json(
        { error: "Missing bid data" },
        { status: 400 }
      );
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
            `New bid submitted for ${bid.contract_version || "Q2-2026"}`,
            ``,
            `Bidder: ${bid.bidder_name}`,
            `Title: ${bid.bidder_title}`,
            `Company: ${bid.bidder_company}`,
            `Email: ${bid.bidder_email}`,
            `Amount: $${Number(bid.bid_amount).toLocaleString()}`,
            `Note: ${bid.note || "(none)"}`,
            ``,
            `Bid ID: ${bid.bid_id || "N/A"}`,
            `Submitted: ${bid.signed_at || new Date().toISOString()}`,
          ].join("\n"),
        }),
      });
    } catch (error) {
      console.error("Admin notification email failed:", error);
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
            `Reference: ${bid.bid_id || "N/A"}`,
            `Contract Version: ${bid.contract_version || "Q2-2026-v1.0"}`,
            `Submitted: ${bid.signed_at || new Date().toISOString()}`,
            ``,
            `You will be notified when your bid status changes.`,
            ``,
            `— Casey Glarkin, DWTB?! Studios`,
          ].join("\n"),
        }),
      });
    } catch (error) {
      console.error("Bidder confirmation email failed:", error);
    }

    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json(
      { error: "Notification failed" },
      { status: 500 }
    );
  }
}
