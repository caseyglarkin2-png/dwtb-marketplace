import { NextResponse } from "next/server";
import { getBids, getSlots } from "@/lib/clawd";
import { FALLBACK_MARKET_DATA, DEADLINE_UTC } from "@/lib/constants";
import { isExpired } from "@/lib/deadline";

export const revalidate = 60; // cache for 60s

interface DepthBucket {
  range: string;
  count: number;
}

interface ActivityItem {
  type: "new_request" | "amount_updated" | "allocation_accepted";
  ago: string;
}

export interface MarketData {
  status: "open" | "closed";
  allocations: { total: number; remaining: number; accepted: number };
  floor_price: number;
  deadline: string;
  depth: DepthBucket[];
  activity: ActivityItem[];
  total_requests: number;
  last_activity: string | null;
  _source: "live" | "fallback";
}

function bucketBids(amounts: number[]): DepthBucket[] {
  const buckets: DepthBucket[] = [
    { range: "$15K – $20K", count: 0 },
    { range: "$20K – $30K", count: 0 },
    { range: "$30K – $50K", count: 0 },
    { range: "$50K+", count: 0 },
  ];

  for (const amt of amounts) {
    if (amt >= 50000) buckets[3].count++;
    else if (amt >= 30000) buckets[2].count++;
    else if (amt >= 20000) buckets[1].count++;
    else buckets[0].count++;
  }

  return buckets;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export async function GET() {
  const expired = isExpired();

  try {
    const [{ bids }, slots] = await Promise.all([getBids(), getSlots()]);

    const amounts = bids.map((b) => b.bid_amount);
    const depth = bucketBids(amounts);

    // Build activity from bids (anonymized — no PII)
    const activity: ActivityItem[] = bids
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      .slice(0, 5)
      .map((b) => ({
        type: b.status === "accepted" ? "allocation_accepted" as const : "new_request" as const,
        ago: relativeTime(b.submitted_at),
      }));

    const lastActivity = bids.length > 0
      ? bids.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at
      : null;

    const data: MarketData = {
      status: expired ? "closed" : "open",
      allocations: {
        total: slots.total,
        remaining: slots.available,
        accepted: slots.sold + slots.committed,
      },
      floor_price: slots.price_monthly,
      deadline: DEADLINE_UTC,
      depth,
      activity,
      total_requests: bids.length,
      last_activity: lastActivity,
      _source: "live",
    };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.warn("[Market API] Railway unavailable, using fallback:", err instanceof Error ? err.message : err);

    return NextResponse.json(
      { ...FALLBACK_MARKET_DATA, status: expired ? "closed" : "open", _source: "fallback" },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } }
    );
  }
}
