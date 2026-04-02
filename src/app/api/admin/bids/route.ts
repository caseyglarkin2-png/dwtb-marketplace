import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateAdminRequest } from "@/lib/admin-auth";

// GET /api/admin/bids — list all bids (admin only)
export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("bids")
    .select("*, contracts(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch bids" },
      { status: 500 }
    );
  }

  return NextResponse.json({ bids: data });
}
