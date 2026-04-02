import { NextResponse } from "next/server";
import { FALLBACK_STATS } from "@/lib/constants";
import { getPipeline } from "@/lib/clawd";

// GET /api/stats — public stats (live from Clawd pipeline)
export async function GET() {
  try {
    const pipeline = await getPipeline();
    const s = pipeline.stats;
    return NextResponse.json({
      proposalsSent: s.by_stage.proposal ?? 0,
      totalViews: s.total_deals,
      viewRate: s.total_deals > 0 ? Math.round((s.by_stage.proposal / s.total_deals) * 100) : 0,
      pipelineValue: s.total_pipeline_value,
      strikeNow: s.by_stage.lead ?? 0,
      asOf: new Date().toISOString(),
      source: "clawd",
    });
  } catch (err) {
    console.error("Clawd pipeline fetch failed:", err);
    return NextResponse.json({
      proposalsSent: FALLBACK_STATS.proposalsSent,
      totalViews: FALLBACK_STATS.totalViews,
      viewRate: FALLBACK_STATS.viewRate,
      pipelineValue: FALLBACK_STATS.pipelineValue,
      strikeNow: FALLBACK_STATS.strikeNow,
      asOf: null,
      source: "fallback",
    });
  }
}
