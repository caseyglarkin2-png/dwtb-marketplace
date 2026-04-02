import { NextResponse } from "next/server";
import {
  DEFAULT_TOTAL_SLOTS,
  DEFAULT_ACCEPTED_SLOTS,
  DEFAULT_MIN_BID,
  DEFAULT_MIN_INCREMENT,
  DEADLINE_UTC,
} from "@/lib/constants";
import { getSlots } from "@/lib/clawd";
import { SlotsStatusSchema } from "@/lib/api-types";
import { cachedFetch } from "@/lib/cache";

// GET /api/slots — public slot state (live from Clawd)
export async function GET() {
  try {
    const { data: raw, source } = await cachedFetch("slots", getSlots);
    const parsed = SlotsStatusSchema.safeParse(raw);

    if (!parsed.success) {
      console.warn("[Slots] Railway returned unexpected shape:", parsed.error.issues);
      return NextResponse.json({
        total_slots: DEFAULT_TOTAL_SLOTS,
        remaining_slots: DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS,
        current_min_bid: DEFAULT_MIN_BID,
        min_increment: DEFAULT_MIN_INCREMENT,
        deadline: DEADLINE_UTC,
        manually_closed: false,
        _source: "fallback" as const,
      });
    }

    const slots = parsed.data;
    return NextResponse.json({
      total_slots: slots.total,
      remaining_slots: slots.available,
      accepted_slots: slots.committed + slots.sold,
      current_min_bid: DEFAULT_MIN_BID,
      min_increment: DEFAULT_MIN_INCREMENT,
      deadline: DEADLINE_UTC,
      manually_closed: false,
      _source: source,
    });
  } catch (err) {
    console.warn("[Slots] Railway fetch failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({
      total_slots: DEFAULT_TOTAL_SLOTS,
      remaining_slots: DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS,
      current_min_bid: DEFAULT_MIN_BID,
      min_increment: DEFAULT_MIN_INCREMENT,
      deadline: DEADLINE_UTC,
      manually_closed: false,
      _source: "fallback" as const,
    });
  }
}
