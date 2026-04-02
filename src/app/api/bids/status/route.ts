import { NextRequest, NextResponse } from "next/server";
import { getBid } from "@/lib/clawd";

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
    const bid = await getBid(ref);

    // Verify email matches (prevent enumeration)
    if (bid.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "No bid found for this reference and email" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      bid_id: bid.bid_id,
      status: bid.status,
      company: bid.company,
      bid_amount: bid.bid_amount,
      submitted_at: bid.submitted_at,
      updated_at: bid.updated_at,
      receipt_url: `/api/bids/receipt/${bid.bid_id}`,
    });
  } catch {
    return NextResponse.json(
      { error: "No bid found for this reference and email" },
      { status: 404 }
    );
  }
}
