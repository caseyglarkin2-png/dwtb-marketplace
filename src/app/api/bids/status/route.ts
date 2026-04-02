import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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

  const supabase = createServiceClient();

  const { data: bid, error } = await supabase
    .from("bids")
    .select(
      "id, status, bid_amount, bidder_company, contract_version, created_at"
    )
    .eq("id", ref)
    .eq("bidder_email", email)
    .maybeSingle();

  if (error || !bid) {
    return NextResponse.json(
      { error: "Bid not found" },
      { status: 404 }
    );
  }

  // Fetch contract receipt URL if available
  const { data: contract } = await supabase
    .from("contracts")
    .select("receipt_url, signed_at")
    .eq("bid_id", bid.id)
    .maybeSingle();

  return NextResponse.json({
    bid_id: bid.id,
    status: bid.status,
    bid_amount: bid.bid_amount,
    company: bid.bidder_company,
    contract_version: bid.contract_version,
    submitted_at: bid.created_at,
    signed_at: contract?.signed_at || null,
    receipt_url: contract?.receipt_url || null,
  });
}
