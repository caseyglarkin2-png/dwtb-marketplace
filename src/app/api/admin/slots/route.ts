import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import {
  DEFAULT_TOTAL_SLOTS,
  DEFAULT_ACCEPTED_SLOTS,
  DEFAULT_MIN_BID,
  DEFAULT_MIN_INCREMENT,
  DEADLINE_UTC,
} from "@/lib/constants";

// GET /api/admin/slots — get slot config (from constants + env)
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    slot_config: {
      total_slots: DEFAULT_TOTAL_SLOTS,
      accepted_slots: DEFAULT_ACCEPTED_SLOTS,
      current_min_bid: DEFAULT_MIN_BID,
      min_increment: DEFAULT_MIN_INCREMENT,
      deadline: DEADLINE_UTC,
      manually_closed: process.env.MANUALLY_CLOSED === "true",
    },
  });
}

// PATCH /api/admin/slots — slot config is managed via env vars / constants
export async function PATCH(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: "Slot config is managed via environment variables and constants. Update DEFAULT_MIN_BID, DEFAULT_TOTAL_SLOTS, etc. in src/lib/constants.ts or set MANUALLY_CLOSED env var.",
    },
    { status: 501 }
  );
}
