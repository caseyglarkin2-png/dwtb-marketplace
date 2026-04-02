import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { appendAuditEntry } from "@/lib/audit";

const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ["pending_review", "accepted", "declined", "waitlisted"],
  pending_review: ["accepted", "declined", "waitlisted"],
  waitlisted: ["accepted", "declined"],
  accepted: ["declined"],
  declined: [],
};

// PATCH /api/admin/bids/[id]/status — admin status transition
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

  const supabase = createServiceClient();

  // Fetch current bid
  const { data: bid, error: fetchError } = await supabase
    .from("bids")
    .select("id, status, bidder_email, bidder_name, bidder_company, bid_amount, contract_version")
    .eq("id", bidId)
    .single();

  if (fetchError || !bid) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

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

  // If accepting: check slot availability
  if (newStatus === "accepted") {
    const { data: slotConfig } = await supabase
      .from("slot_config")
      .select("total_slots, accepted_slots")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (slotConfig && slotConfig.accepted_slots >= slotConfig.total_slots) {
      return NextResponse.json(
        {
          error: "SLOTS_FULL",
          message: "All slots are filled. Cannot accept more bids.",
        },
        { status: 409 }
      );
    }

    // Increment accepted_slots
    if (slotConfig) {
      await supabase
        .from("slot_config")
        .update({
          accepted_slots: slotConfig.accepted_slots + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("total_slots", slotConfig.total_slots); // match the row
    }
  }

  // If previously accepted and now declining: decrement accepted_slots
  if (bid.status === "accepted" && newStatus === "declined") {
    const { data: slotConfig } = await supabase
      .from("slot_config")
      .select("accepted_slots")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (slotConfig && slotConfig.accepted_slots > 0) {
      await supabase
        .from("slot_config")
        .update({
          accepted_slots: slotConfig.accepted_slots - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("accepted_slots", slotConfig.accepted_slots);
    }
  }

  // Update bid status
  const { error: updateError } = await supabase
    .from("bids")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", bidId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }

  // Update pending_slots count
  if (newStatus === "pending_review") {
    // Increment pending
    const { data: sc } = await supabase
      .from("slot_config")
      .select("pending_slots")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sc) {
      await supabase
        .from("slot_config")
        .update({ pending_slots: sc.pending_slots + 1 })
        .eq("pending_slots", sc.pending_slots);
    }
  } else if (bid.status === "pending_review") {
    // Decrement pending if moving away from pending_review
    const { data: sc } = await supabase
      .from("slot_config")
      .select("pending_slots")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sc && sc.pending_slots > 0) {
      await supabase
        .from("slot_config")
        .update({ pending_slots: sc.pending_slots - 1 })
        .eq("pending_slots", sc.pending_slots);
    }
  }

  // Audit trail
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  await appendAuditEntry({
    eventType:
      newStatus === "accepted"
        ? "bid_accepted"
        : newStatus === "declined"
        ? "bid_declined"
        : newStatus === "waitlisted"
        ? "bid_waitlisted"
        : "bid_submitted",
    entityType: "bid",
    entityId: bidId,
    actorIp: ip,
    payload: {
      previous_status: bid.status,
      new_status: newStatus,
    },
  });

  // Send status change email to bidder (fire-and-forget)
  sendStatusEmail(bid, newStatus).catch(console.error);

  return NextResponse.json({
    bid_id: bidId,
    previous_status: bid.status,
    new_status: newStatus,
  });
}

async function sendStatusEmail(
  bid: {
    id: string;
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
    accepted: {
      subject: "Bid Accepted — DWTB?! Studios Q2 2026",
      body: `${bid.bidder_name},\n\nYour bid has been accepted. Casey will be in touch within 24 hours to confirm next steps.\n\nBid Amount: $${Number(bid.bid_amount).toLocaleString()}\nReference: ${bid.id}\n\n— Casey Glarkin, DWTB?! Studios`,
    },
    declined: {
      subject: "Bid Update — DWTB?! Studios Q2 2026",
      body: `${bid.bidder_name},\n\nYour bid was not selected for Q2. DWTB?! Studios will be running a limited Q3 window. Watch for an invite.\n\nReference: ${bid.id}\n\n— Casey Glarkin, DWTB?! Studios`,
    },
    waitlisted: {
      subject: "Bid Waitlisted — DWTB?! Studios Q2 2026",
      body: `${bid.bidder_name},\n\nYour bid is on the waitlist. If a slot opens before April 6, you will hear from us immediately.\n\nReference: ${bid.id}\n\n— Casey Glarkin, DWTB?! Studios`,
    },
    pending_review: {
      subject: "Bid Under Review — DWTB?! Studios Q2 2026",
      body: `${bid.bidder_name},\n\nYour bid is now under review. You will be notified of the outcome.\n\nReference: ${bid.id}\n\n— Casey Glarkin, DWTB?! Studios`,
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
    const supabase = createServiceClient();
    await appendAuditEntry({
      eventType: "email_delivery_failed",
      entityType: "bid",
      entityId: bid.id,
      actorEmail: bid.bidder_email,
      payload: { status: newStatus, error: String(error) },
    });

    // This function is called as a standalone, so we need to import supabase again if needed
    // Actually appendAuditEntry already handles its own client. No extra action needed.
  }
}
