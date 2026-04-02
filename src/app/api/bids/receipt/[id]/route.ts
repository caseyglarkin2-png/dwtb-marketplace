import { NextRequest, NextResponse } from "next/server";
import { getLeadById, extractBidRecord } from "@/lib/clawd";
import { renderContractText } from "@/lib/contract-text";
import { generateContractPdf } from "@/lib/pdf";

// GET /api/bids/receipt/[id]?email=<bidder_email> — download signed contract PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = new URL(request.url).searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email is required for receipt access" },
      { status: 400 }
    );
  }

  try {
    const lead = await getLeadById(id);

    // Verify email matches (prevent unauthorized downloads)
    if (lead.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const bid = extractBidRecord(lead);

    const contractText = renderContractText({
      bidderName: bid.bidder_name,
      bidderTitle: bid.bidder_title,
      bidderCompany: bid.bidder_company,
      bidAmount: bid.bid_amount,
      date: new Date(bid.signed_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    const pdf = generateContractPdf({
      contractText,
      bidderName: bid.bidder_name,
      bidderCompany: bid.bidder_company,
      bidAmount: bid.bid_amount,
      signedAt: bid.signed_at,
      bidId: bid.bid_id,
      signatureHash: bid.signature_hash,
      contractVersion: bid.contract_version,
    });

    return new NextResponse(pdf.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="DWTB-Contract-${bid.bid_id.slice(0, 8)}.pdf"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Receipt not found" },
      { status: 404 }
    );
  }
}
