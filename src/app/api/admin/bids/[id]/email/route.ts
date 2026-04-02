import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { getBid, toBidRecord } from "@/lib/clawd";
import { appendAuditEntry } from "@/lib/audit";

// POST /api/admin/bids/[id]/email — send custom email to bidder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bidId } = await params;

  let body: { subject?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.subject || typeof body.subject !== "string" || !body.body || typeof body.body !== "string") {
    return NextResponse.json({ error: "Subject and body required" }, { status: 400 });
  }

  if (body.subject.length > 200) {
    return NextResponse.json({ error: "Subject too long (max 200 chars)" }, { status: 400 });
  }

  if (body.body.length > 5000) {
    return NextResponse.json({ error: "Body too long (max 5000 chars)" }, { status: 400 });
  }

  let bid;
  try {
    const clawdBid = await getBid(bidId);
    bid = toBidRecord(clawdBid);
  } catch {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Casey Glarkin — DWTB?! Studios <bids@dwtb.dev>",
        to: [bid.bidder_email],
        subject: body.subject,
        text: body.body,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown");
      throw new Error(`Resend ${res.status}: ${errText}`);
    }

    appendAuditEntry({
      eventType: "email_sent",
      entityType: "bid",
      entityId: bidId,
      payload: { subject: body.subject, to: bid.bidder_email },
    });

    return NextResponse.json({ sent: true, to: bid.bidder_email });
  } catch (error) {
    appendAuditEntry({
      eventType: "email_delivery_failed",
      entityType: "bid",
      entityId: bidId,
      payload: { subject: body.subject, error: String(error) },
    });
    return NextResponse.json(
      { error: "Email delivery failed" },
      { status: 502 }
    );
  }
}
