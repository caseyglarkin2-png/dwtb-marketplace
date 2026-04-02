import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { getBids } from "@/lib/clawd";

// GET /api/admin/bids — list all marketplace bids (admin only)
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bids } = await getBids();
    return NextResponse.json({ bids });
  } catch (err) {
    console.error("Clawd marketplace bids fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch bids" },
      { status: 502 }
    );
  }
}
