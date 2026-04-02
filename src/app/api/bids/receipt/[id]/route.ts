import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateContractPdf } from "@/lib/pdf";
import { renderContractText } from "@/lib/contract-text";

// GET /api/bids/receipt/[id] — download signed contract PDF
// Requires both bid ID and email for access control (no auth needed)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bidId } = await params;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email parameter required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Fetch bid + contract
  const { data: bid } = await supabase
    .from("bids")
    .select("*")
    .eq("id", bidId)
    .eq("bidder_email", email)
    .single();

  if (!bid) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("bid_id", bidId)
    .single();

  if (!contract) {
    return NextResponse.json(
      { error: "Contract not found" },
      { status: 404 }
    );
  }

  // Generate contract text
  const contractText = renderContractText({
    bidderName: bid.bidder_name,
    bidderTitle: bid.bidder_title,
    bidderCompany: bid.bidder_company,
    bidAmount: Number(bid.bid_amount),
    date: new Date(contract.signed_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  });

  // Generate PDF
  const pdfBytes = generateContractPdf({
    contractText,
    bidderName: bid.bidder_name,
    bidderCompany: bid.bidder_company,
    bidAmount: Number(bid.bid_amount),
    signedAt: contract.signed_at,
    bidId: bid.id,
    signatureHash: contract.signature_hash,
    contractVersion: bid.contract_version,
  });

  const filename = `DWTB-Q2-2026-Contract-${bid.bidder_company.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;

  return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBytes.length),
    },
  });
}
