import { z } from "zod";

// ── Railway API Response Schemas ────────────────────────
// These match the LIVE Railway API contracts verified April 2, 2026

export const SlotInfoSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export const SlotsStatusSchema = z.object({
  slots: z.array(SlotInfoSchema),
  available: z.number(),
  held: z.number(),
  committed: z.number(),
  sold: z.number(),
  total: z.number(),
  access_mode: z.string(),
  quarter: z.string(),
  price_monthly: z.number(),
  engagement_months: z.number(),
});

export const PipelineStatsSchema = z.object({
  total_deals: z.number(),
  by_stage: z.record(z.string(), z.number()),
  total_pipeline_value: z.number(),
  active_pipeline_value: z.number(),
  won_value: z.number(),
  won_count: z.number(),
  lost_count: z.number(),
  win_rate_pct: z.number(),
  stages: z.array(z.string()),
  stage_labels: z.record(z.string(), z.string()).optional(),
});

export const PipelineResponseSchema = z.object({
  deals: z.array(z.record(z.string(), z.unknown())),
  total: z.number(),
  stats: PipelineStatsSchema,
});

export const ClawdBidSchema = z.object({
  bid_id: z.string(),
  company: z.string(),
  name: z.string(),
  email: z.string(),
  bid_amount: z.number(),
  status: z.string(),
  title: z.string().optional(),
  message: z.string().optional(),
  status_note: z.string().optional(),
  agreement_accepted: z.boolean().optional(),
  consent_hash: z.string().optional(),
  submitted_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const BidsResponseSchema = z.object({
  total: z.number(),
  bids: z.array(ClawdBidSchema),
});

export const LeadStatsSchema = z.object({
  total: z.number(),
  new: z.number(),
  last_24h: z.number(),
  top_source: z.string(),
  by_source: z.record(z.string(), z.number()),
  by_intent: z.record(z.string(), z.number()),
});

// ── Frontend API Response Schemas ───────────────────────
// These are what our Next.js route handlers return to the browser

export const SlotsResponseSchema = z.object({
  total_slots: z.number(),
  remaining_slots: z.number(),
  current_min_bid: z.number(),
  min_increment: z.number(),
  deadline: z.string(),
  manually_closed: z.boolean(),
  _source: z.enum(["live", "fallback", "cached"]),
});

export const StatsResponseSchema = z.object({
  proposalsSent: z.number(),
  totalViews: z.number(),
  viewRate: z.number(),
  pipelineValue: z.number(),
  strikeNow: z.number(),
  asOf: z.string().nullable(),
  _source: z.enum(["live", "fallback", "cached"]),
});

export const BidSubmitResponseSchema = z.object({
  bid_id: z.string(),
  status: z.string(),
  signature_hash: z.string(),
  contract_version: z.string(),
  signed_at: z.string(),
});

export const HealthResponseSchema = z.object({
  status: z.enum(["ok", "down"]),
  railway_online: z.boolean(),
  latency_ms: z.number(),
  timestamp: z.string(),
});

// ── TypeScript Types ────────────────────────────────────

export type SlotsResponse = z.infer<typeof SlotsResponseSchema>;
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type BidSubmitResponse = z.infer<typeof BidSubmitResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
