import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";

// GET /api/admin/audit — view audit trail
// Audit is currently console-only (no persistent store). Returns empty.
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Audit entries are logged to stdout/Railway logs.
  // No persistent query available yet.
  return NextResponse.json({
    entries: [],
    note: "Audit entries are logged to stdout. Query Railway logs for full trail.",
  });
}
