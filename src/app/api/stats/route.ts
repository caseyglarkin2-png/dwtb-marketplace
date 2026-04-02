import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { FALLBACK_STATS } from "@/lib/constants";

// GET /api/stats — public stats with freshness indicator
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("stats_snapshot")
      .select("*")
      .order("as_of", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
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

    return NextResponse.json({
      proposalsSent: data.proposals_sent,
      totalViews: data.total_views,
      viewRate: Number(data.view_rate),
      pipelineValue: Number(data.pipeline_value),
      strikeNow: data.strike_now,
      asOf: data.as_of,
      source: data.source,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
