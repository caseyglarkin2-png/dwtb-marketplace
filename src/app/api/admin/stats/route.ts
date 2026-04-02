import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { getLeadStats } from "@/lib/clawd";
import { FALLBACK_STATS } from "@/lib/constants";

// GET /api/admin/stats — get current stats from Clawd + constants
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clawdStats = await getLeadStats("dwtb");
    return NextResponse.json({
      stats: [{
        proposals_sent: FALLBACK_STATS.proposalsSent,
        total_views: FALLBACK_STATS.totalViews,
        view_rate: FALLBACK_STATS.viewRate,
        pipeline_value: FALLBACK_STATS.pipelineValue,
        strike_now: FALLBACK_STATS.strikeNow,
        total_leads: clawdStats.total,
        new_leads: clawdStats.new,
        last_24h: clawdStats.last_24h,
        as_of: new Date().toISOString(),
        source: "clawd+constants",
      }],
    });
  } catch {
    return NextResponse.json({
      stats: [{
        ...FALLBACK_STATS,
        as_of: new Date().toISOString(),
        source: "constants_only",
      }],
    });
  }
}

// POST /api/admin/stats — stats are derived from Clawd + constants
export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Stats are derived from Clawd lead data and constants. Update FALLBACK_STATS in src/lib/constants.ts for base metrics." },
    { status: 501 }
  );
}
