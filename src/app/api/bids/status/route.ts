import { NextRequest, NextResponse } from "next/server";
import { getLeadById, extractBidRecord } from "@/lib/clawd";

// GET /api/bids/status?ref=<bid_id>&email=<bidder_email> — public bid status check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const email = searchParams.get("email");

  if (!ref || !email) {
    return NextResponse.json(
      { error: "Both ref and email are required" },
      { status: 400 }
    );
  }

  try {
    const lead = await getLeadById(ref);

    // Verify email matches (prevent enumeration)
    if (lead.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "No bid found for this reference and email" },
        { status: 404 }
      );
    }

    const bid = extractBidRecord(lead);

    return NextResponse.json({
      bid_id: bid.bid_id,
      status: bid.status,
      company: bid.bidder_company,
      bid_amount: bid.bid_amount,
      contract_version: bid.contract_version,
      submitted_at: bid.submitted_at,
      signed_at: bid.signed_at,
      accepted_at: bid.accepted_at || null,
      paid_at: bid.paid_at || null,
      receipt_url: `/api/bids/receipt/${bid.bid_id}`,
    });
  } catch {
    return NextResponse.json(
      { error: "No bid found for this reference and email" },
      { status: 404 }
    );
  }
}
