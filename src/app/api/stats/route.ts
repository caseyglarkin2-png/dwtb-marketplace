import { NextResponse } from "next/server";
import { FALLBACK_STATS } from "@/lib/constants";
import { getPipeline } from "@/lib/clawd";
import { PipelineResponseSchema } from "@/lib/api-types";
import { cachedFetch } from "@/lib/cache";

// GET /api/stats — public stats (live from Clawd pipeline)
export async function GET() {
  try {
    const { data: raw, source } = await cachedFetch("pipeline", getPipeline);
    const parsed = PipelineResponseSchema.safeParse(raw);

    if (!parsed.success) {
      console.warn("[Stats] Railway returned unexpected pipeline shape:", parsed.error.issues);
      return NextResponse.json({
        ...FALLBACK_STATS,
        asOf: null,
        _source: "fallback" as const,
      });
    }

    const s = parsed.data.stats;
    return NextResponse.json({
      proposalsSent: s.by_stage.proposal ?? 0,
      totalViews: s.total_deals,
      viewRate: s.total_deals > 0 ? Math.round(((s.by_stage.proposal ?? 0) / s.total_deals) * 100) : 0,
      pipelineValue: s.total_pipeline_value,
      strikeNow: s.by_stage.lead ?? 0,
      asOf: new Date().toISOString(),
      _source: source,
    });
  } catch (err) {
    console.warn("[Stats] Railway pipeline fetch failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({
      ...FALLBACK_STATS,
      asOf: null,
      _source: "fallback" as const,
    });
  }
}
