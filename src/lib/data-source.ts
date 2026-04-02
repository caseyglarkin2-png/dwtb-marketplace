// Data source abstraction — centralises all backend data access.
// Consumers call these functions; they never call internal clawd internals directly.
// Fallback constants are used when Railway is unavailable.

import { getPipeline, getSlots, getBids, createBid } from "@/lib/clawd";
import type { SlotsStatus, PipelineResponse } from "@/lib/clawd";
import { cachedFetch, type CacheSource } from "@/lib/cache";
import {
  FALLBACK_STATS,
  FALLBACK_MARKET_DATA,
  DEFAULT_TOTAL_SLOTS,
  DEFAULT_ACCEPTED_SLOTS,
} from "@/lib/constants";

// ── Shape definitions ────────────────────────────────────────────

export interface StatsResult {
  proposalsSent: number;
  totalViews: number;
  viewRate: number;
  pipelineValue: number;
  strikeNow: number;
  asOf: string | null;
  _source: CacheSource | "fallback";
}

export interface SlotsResult {
  remainingSlots: number;
  totalSlots: number;
  heldSlots: number;
  committedSlots: number;
  soldSlots: number;
  quarter: string;
  priceMonthly: number;
  engagementMonths: number;
  _source: CacheSource | "fallback";
}

export interface DepthBucket {
  range: string;
  count: number;
}

export interface ActivityEvent {
  type: "new_request" | "amount_updated" | "allocation_confirmed";
  ago: string;
}

export interface MarketDepthResult {
  status: "open" | "closed" | "sold_out";
  allocations: { total: number; remaining: number; accepted: number };
  floor_price: number;
  deadline: string;
  depth: DepthBucket[];
  activity: ActivityEvent[];
  total_requests: number;
  last_activity: string;
  _source: CacheSource | "fallback";
}

export interface BidPayload {
  bidderName: string;
  bidderTitle: string;
  bidderCompany: string;
  bidderEmail: string;
  bidAmount: number;
  tier: string;
  note?: string;
  typedName: string;
  consentGiven: boolean;
  signatureData: string;
  idempotencyKey: string;
}

export interface BidResult {
  bid_id: string;
  status: string;
  signature_hash: string;
  contract_version: string;
  signed_at: string;
}

// ── DataSource interface ─────────────────────────────────────────

export interface DataSource {
  getStats(): Promise<StatsResult>;
  getSlots(): Promise<SlotsResult>;
  getMarketDepth(): Promise<MarketDepthResult>;
  submitBid(payload: BidPayload): Promise<BidResult>;
}

// ── Clawd implementation ─────────────────────────────────────────

async function fetchStats(): Promise<StatsResult> {
  const { data, source } = await cachedFetch("stats", async () => {
    const raw = await getPipeline();
    const s = raw.stats;
    const byStage = s.by_stage || {};
    const active =
      (byStage.lead || 0) +
      (byStage.qualified || 0) +
      (byStage.proposal || 0);
    const totalDeals = s.total_deals || 0;

    return {
      proposalsSent: byStage.proposal || FALLBACK_STATS.proposalsSent,
      totalViews: totalDeals || FALLBACK_STATS.totalViews,
      viewRate:
        totalDeals > 0
          ? Math.round((active / totalDeals) * 100)
          : FALLBACK_STATS.viewRate,
      pipelineValue:
        s.total_pipeline_value || FALLBACK_STATS.pipelineValue,
      strikeNow: active || FALLBACK_STATS.strikeNow,
      asOf: new Date().toISOString(),
    };
  });

  return { ...data, _source: source };
}

async function fetchSlots(): Promise<SlotsResult> {
  const { data, source } = await cachedFetch("slots", async () => {
    const raw = await getSlots();
    return {
      remainingSlots: raw.available ?? DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS,
      totalSlots: raw.total ?? DEFAULT_TOTAL_SLOTS,
      heldSlots: raw.held ?? 0,
      committedSlots: raw.committed ?? 0,
      soldSlots: raw.sold ?? 0,
      quarter: raw.quarter ?? "Q2-2026",
      priceMonthly: raw.price_monthly ?? 10000,
      engagementMonths: raw.engagement_months ?? 3,
    };
  });

  return { ...data, _source: source };
}

async function fetchMarketDepth(): Promise<MarketDepthResult> {
  const { data, source } = await cachedFetch("market", async () => {
    const [slotsRaw, bidsRaw] = await Promise.all([
      getSlots(),
      getBids(),
    ]);

    const remaining = slotsRaw.available ?? 2;
    const total = slotsRaw.total ?? 3;
    const accepted = slotsRaw.sold ?? 0;
    const bids = bidsRaw.bids ?? [];

    const brackets = [
      { range: "$15K – $20K", min: 15000, max: 20000 },
      { range: "$20K – $30K", min: 20000, max: 30000 },
      { range: "$30K – $50K", min: 30000, max: 50000 },
      { range: "$50K+", min: 50000, max: Infinity },
    ];

    const depth = brackets.map(({ range, min, max }) => ({
      range,
      count: bids.filter((b) => b.bid_amount >= min && b.bid_amount < max).length,
    }));

    const lastBid = [...bids].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];

    return {
      status: remaining === 0 ? ("sold_out" as const) : ("open" as const),
      allocations: { total, remaining, accepted },
      floor_price: FALLBACK_MARKET_DATA.floor_price,
      deadline: FALLBACK_MARKET_DATA.deadline,
      depth,
      activity: [...FALLBACK_MARKET_DATA.activity] as ActivityEvent[],
      total_requests: bids.length,
      last_activity: lastBid?.updated_at ?? new Date().toISOString(),
    };
  });

  return { ...data, _source: source };
}

async function submitBid(payload: BidPayload): Promise<BidResult> {
  const bid = await createBid({
    company: payload.bidderCompany,
    name: payload.bidderName,
    email: payload.bidderEmail,
    title: payload.bidderTitle,
    bid_amount: payload.bidAmount,
    message: payload.note,
    agreement_accepted: payload.consentGiven,
    consent_hash: payload.signatureData,
  });

  return {
    bid_id: bid.bid_id,
    status: bid.status,
    signature_hash: bid.signature_hash ?? bid.consent_hash ?? "",
    contract_version: bid.contract_version ?? "",
    signed_at: bid.submitted_at,
  };
}

// ── Singleton export ─────────────────────────────────────────────

export const dataSource: DataSource = {
  getStats: fetchStats,
  getSlots: fetchSlots,
  getMarketDepth: fetchMarketDepth,
  submitBid,
};
