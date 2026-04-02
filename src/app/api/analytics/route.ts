import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = body?.events;
    if (!Array.isArray(events) || events.length === 0 || events.length > 50) {
      return NextResponse.json({ error: "Invalid events" }, { status: 400 });
    }

    const valid = events.filter(
      (e: { event?: string }) =>
        typeof e.event === "string" && e.event.length <= 50
    );

    if (valid.length > 0) {
      console.log(`[analytics] received ${valid.length} events`);
    }

    return NextResponse.json({ received: valid.length });
  } catch {
    return NextResponse.json({ received: 0 });
  }
}
