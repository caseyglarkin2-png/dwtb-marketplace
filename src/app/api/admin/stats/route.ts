import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { appendAuditEntry } from "@/lib/audit";

// GET /api/admin/stats — get current stats
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("stats_snapshot")
    .select("*")
    .order("as_of", { ascending: false })
    .limit(5);

  return NextResponse.json({ stats: data || [] });
}

// POST /api/admin/stats — update stats
export async function POST(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    proposals_sent?: number;
    total_views?: number;
    view_rate?: number;
    pipeline_value?: number;
    strike_now?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    typeof body.proposals_sent !== "number" ||
    typeof body.total_views !== "number" ||
    typeof body.view_rate !== "number" ||
    typeof body.pipeline_value !== "number" ||
    typeof body.strike_now !== "number"
  ) {
    return NextResponse.json(
      { error: "All stats fields are required as numbers" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("stats_snapshot")
    .insert({
      proposals_sent: body.proposals_sent,
      total_views: body.total_views,
      view_rate: body.view_rate,
      pipeline_value: body.pipeline_value,
      strike_now: body.strike_now,
      source: "admin",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update stats" },
      { status: 500 }
    );
  }

  await appendAuditEntry({
    eventType: "slot_config_updated",
    entityType: "stats_snapshot",
    entityId: data.id,
    payload: body,
  });

  return NextResponse.json({ stats: data }, { status: 201 });
}
