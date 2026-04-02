import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { appendAuditEntry } from "@/lib/audit";

// GET /api/admin/slots — get full slot config (admin view with pending)
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("slot_config")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ slot_config: data });
}

// PATCH /api/admin/slots — update slot config
export async function PATCH(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    current_min_bid?: number;
    min_increment?: number;
    manually_closed?: boolean;
    deadline?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get current config
  const { data: current } = await supabase
    .from("slot_config")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!current) {
    return NextResponse.json(
      { error: "No slot config found" },
      { status: 404 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.current_min_bid === "number")
    updates.current_min_bid = body.current_min_bid;
  if (typeof body.min_increment === "number")
    updates.min_increment = body.min_increment;
  if (typeof body.manually_closed === "boolean")
    updates.manually_closed = body.manually_closed;
  if (body.deadline) updates.deadline = body.deadline;

  const { data, error } = await supabase
    .from("slot_config")
    .update(updates)
    .eq("id", current.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update slot config" },
      { status: 500 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  await appendAuditEntry({
    eventType: "slot_config_updated",
    entityType: "slot_config",
    entityId: current.id,
    actorIp: ip,
    payload: body,
  });

  return NextResponse.json({ slot_config: data });
}
