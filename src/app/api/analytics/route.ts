import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = body?.events;
    if (!Array.isArray(events) || events.length === 0 || events.length > 50) {
      return NextResponse.json({ error: "Invalid events" }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      // No DB — silently accept
      return NextResponse.json({ received: events.length });
    }

    const rows = events
      .filter(
        (e: { event?: string }) =>
          typeof e.event === "string" && e.event.length <= 50
      )
      .map((e: { event: string; properties?: Record<string, unknown>; timestamp?: string }) => ({
        entity_type: "analytics",
        entity_id: e.event,
        action: e.event,
        metadata: e.properties ? JSON.stringify(e.properties) : null,
        created_at: e.timestamp || new Date().toISOString(),
      }));

    if (rows.length > 0) {
      await supabase.from("audit_trail").insert(rows);
    }

    return NextResponse.json({ received: rows.length });
  } catch {
    return NextResponse.json({ received: 0 });
  }
}
