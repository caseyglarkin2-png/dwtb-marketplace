import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { checkClawdConnection } from "@/lib/clawd";
import { DEADLINE_UTC } from "@/lib/constants";

// GET /api/admin/readiness — launch readiness checks
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [railway] = await Promise.all([checkClawdConnection()]);

  const deadlineInFuture = new Date(DEADLINE_UTC).getTime() > Date.now();
  const adminSecretSet = !!process.env.ADMIN_SECRET;

  const checks = {
    railway_connected: railway.connected,
    railway_latency_ms: railway.latency,
    deadline_in_future: deadlineInFuture,
    admin_secret_set: adminSecretSet,
  };

  const ready = checks.railway_connected && checks.deadline_in_future && checks.admin_secret_set;

  return NextResponse.json({ ready, checks });
}
