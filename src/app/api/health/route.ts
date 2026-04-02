import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { checkClawdConnection } from "@/lib/clawd";

// GET /api/health — Railway connectivity check (admin-protected)
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkClawdConnection();

  return NextResponse.json({
    status: result.connected ? "ok" : "down",
    railway_online: result.connected,
    latency_ms: result.latency,
    timestamp: new Date().toISOString(),
  });
}
