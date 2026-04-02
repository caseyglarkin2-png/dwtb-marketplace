import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_TOTAL_SLOTS,
  DEFAULT_ACCEPTED_SLOTS,
  DEFAULT_MIN_BID,
  DEFAULT_MIN_INCREMENT,
  DEADLINE_UTC,
} from "@/lib/constants";

// GET /api/slots — public slot state (competitive lockdown: no pending count or bid amounts)
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("slot_config")
      .select(
        "total_slots, accepted_slots, current_min_bid, min_increment, deadline, manually_closed"
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Fallback to defaults if no slot_config row exists
      return NextResponse.json({
        total_slots: DEFAULT_TOTAL_SLOTS,
        remaining_slots: DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS,
        current_min_bid: DEFAULT_MIN_BID,
        min_increment: DEFAULT_MIN_INCREMENT,
        deadline: DEADLINE_UTC,
        manually_closed: false,
      });
    }

    return NextResponse.json({
      total_slots: data.total_slots,
      remaining_slots: data.total_slots - data.accepted_slots,
      current_min_bid: data.current_min_bid,
      min_increment: data.min_increment,
      deadline: data.deadline,
      manually_closed: data.manually_closed,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch slot state" },
      { status: 500 }
    );
  }
}
