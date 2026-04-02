import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import {
  renderBidConfirmationEmail,
  renderAdminNotificationEmail,
} from "@/lib/email-templates";

// POST /api/bids/notify — send bid confirmation emails (admin-only)
// Accepts bid data directly in request body (no DB lookup)
export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const adminEmail_ = renderAdminNotificationEmail({
      bidderName: bid.bidder_name,
      bidderTitle: bid.bidder_title,
      bidderCompany: bid.bidder_company,
      bidderEmail: bid.bidder_email,
      bidAmount: Number(bid.bid_amount),
      bidId: bid.bid_id || "N/A",
      contractVersion: bid.contract_version || "Q2-2026-v2.0",
      signedAt: bid.signed_at || new Date().toISOString(),
      note: bid.note,
    });

    const bidderEmail_ = renderBidConfirmationEmail({
      bidderName: bid.bidder_name,
      bidderCompany: bid.bidder_company,
      bidAmount: Number(bid.bid_amount),
      bidId: bid.bid_id || "N/A",
      contractVersion: bid.contract_version || "Q2-2026-v2.0",
      signedAt: bid.signed_at || new Date().toISOString(),
    });

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
          subject: adminEmail_.subject,
          text: adminEmail_.text,
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
          subject: bidderEmail_.subject,
          html: bidderEmail_.html,
          text: bidderEmail_.text,
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
