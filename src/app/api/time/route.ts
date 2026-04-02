import { NextResponse } from "next/server";

// GET /api/time — server UTC timestamp for client clock sync (F17)
export async function GET() {
  return NextResponse.json({ utc: new Date().toISOString() });
}
