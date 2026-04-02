import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { getPipeline } from "@/lib/clawd";

// GET /api/admin/bids — list all deals from Clawd pipeline (admin only)
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pipeline = await getPipeline();
    const bids = pipeline.deals.map((d) => ({
      id: d.deal_id,
      bidder_name: d.contact_name,
      bidder_email: d.contact_email,
      bidder_company: d.company,
      bid_amount: d.deal_value,
      status: d.stage,
      source: d.source,
      audit_score: d.audit_score,
      classification: d.classification,
      notes: d.notes,
      domain: d.domain,
      strongest_gap: d.strongest_gap,
      stage_history: d.stage_history || [],
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));
    return NextResponse.json({ bids });
  } catch (err) {
    console.error("Clawd pipeline fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch bids from pipeline" },
      { status: 502 }
    );
  }
}
