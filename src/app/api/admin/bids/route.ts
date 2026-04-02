import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { getBids } from "@/lib/clawd";
import { BidsResponseSchema } from "@/lib/api-types";

// GET /api/admin/bids — list all marketplace bids (admin only)
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await getBids();
    const parsed = BidsResponseSchema.safeParse(raw);

    if (!parsed.success) {
      console.warn("[Admin/Bids] Railway returned unexpected shape:", parsed.error.issues);
      // Return what we can parse
      return NextResponse.json({
        bids: Array.isArray(raw?.bids) ? raw.bids : [],
        total: raw?.total ?? 0,
        _source: "live" as const,
      });
    }

    return NextResponse.json({
      bids: parsed.data.bids,
      total: parsed.data.total,
      _source: "live" as const,
    });
  } catch (err) {
    console.warn("[Admin/Bids] Railway fetch failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Backend unavailable", _source: "fallback" as const },
      { status: 503 }
    );
  }
}
