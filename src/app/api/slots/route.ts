import { NextResponse } from "next/server";
import {
  DEFAULT_TOTAL_SLOTS,
  DEFAULT_ACCEPTED_SLOTS,
  DEFAULT_MIN_BID,
  DEFAULT_MIN_INCREMENT,
  DEADLINE_UTC,
} from "@/lib/constants";
import { getLeadStats } from "@/lib/clawd";

// GET /api/slots — public slot state (live from Clawd)
export async function GET() {
  try {
    const stats = await getLeadStats("dwtb");
    const accepted = stats.total;
    return NextResponse.json({
      total_slots: DEFAULT_TOTAL_SLOTS,
      remaining_slots: Math.max(0, DEFAULT_TOTAL_SLOTS - accepted),
      current_min_bid: DEFAULT_MIN_BID,
      min_increment: DEFAULT_MIN_INCREMENT,
      deadline: DEADLINE_UTC,
      manually_closed: false,
      source: "clawd",
    });
  } catch (err) {
    console.error("Clawd lead stats fetch failed:", err);
    return NextResponse.json({
      total_slots: DEFAULT_TOTAL_SLOTS,
      remaining_slots: DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS,
      current_min_bid: DEFAULT_MIN_BID,
      min_increment: DEFAULT_MIN_INCREMENT,
      deadline: DEADLINE_UTC,
      manually_closed: false,
      source: "fallback",
    });
  }
}
