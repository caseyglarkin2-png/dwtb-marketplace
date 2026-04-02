import { describe, it, expect } from "vitest";
import {
  SlotsStatusSchema,
  PipelineResponseSchema,
  BidsResponseSchema,
  LeadStatsSchema,
  ClawdBidSchema,
} from "@/lib/api-types";

// These tests validate that our Zod schemas match the LIVE Railway API
// response shapes verified on April 2, 2026 via curl.

describe("Railway API Contract Shapes", () => {
  it("validates GET /api/slots/status shape", () => {
    const liveResponse = {
      slots: [
        { id: "slot-1", status: "available" },
        { id: "slot-2", status: "available" },
        { id: "slot-3", status: "available" },
      ],
      available: 3,
      held: 0,
      committed: 0,
      sold: 0,
      total: 3,
      access_mode: "private",
      quarter: "Q2-2026",
      price_monthly: 10000,
      engagement_months: 3,
    };
    expect(SlotsStatusSchema.safeParse(liveResponse).success).toBe(true);
  });

  it("rejects slots response missing required fields", () => {
    expect(SlotsStatusSchema.safeParse({ available: 3 }).success).toBe(false);
    expect(SlotsStatusSchema.safeParse({}).success).toBe(false);
  });

  it("validates GET /api/marketplace/bids shape", () => {
    const liveResponse = { total: 0, bids: [] };
    expect(BidsResponseSchema.safeParse(liveResponse).success).toBe(true);
  });

  it("validates bids response with bid data", () => {
    const response = {
      total: 1,
      bids: [
        {
          bid_id: "test-123",
          company: "Acme Corp",
          name: "Jane Doe",
          email: "jane@acme.com",
          bid_amount: 10000,
          status: "pending",
          title: "CEO",
          message: "Tier: growth",
          agreement_accepted: true,
          consent_hash: "abc123",
          submitted_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
        },
      ],
    };
    expect(BidsResponseSchema.safeParse(response).success).toBe(true);
  });

  it("validates GET /api/dwtb-pipeline shape", () => {
    const liveResponse = {
      deals: [],
      total: 47,
      stats: {
        total_deals: 47,
        by_stage: {
          lead: 17,
          qualified: 0,
          proposal: 30,
          negotiation: 0,
          closed_won: 0,
          closed_lost: 0,
        },
        total_pipeline_value: 485000,
        active_pipeline_value: 485000,
        won_value: 0,
        won_count: 0,
        lost_count: 0,
        win_rate_pct: 0,
        stages: ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"],
        stage_labels: {
          lead: "Lead",
          qualified: "Qualified",
          proposal: "Proposal",
          negotiation: "Negotiation",
          closed_won: "Closed Won",
          closed_lost: "Closed Lost",
        },
      },
    };
    expect(PipelineResponseSchema.safeParse(liveResponse).success).toBe(true);
  });

  it("validates GET /api/intake/leads/stats shape", () => {
    const liveResponse = {
      total: 0,
      new: 0,
      last_24h: 0,
      top_source: "",
      by_source: {},
      by_intent: {},
    };
    expect(LeadStatsSchema.safeParse(liveResponse).success).toBe(true);
  });

  it("validates individual ClawdBid shape", () => {
    const bid = {
      bid_id: "uuid-123",
      company: "Test Co",
      name: "Test User",
      email: "test@test.com",
      bid_amount: 7500,
      status: "pending",
    };
    expect(ClawdBidSchema.safeParse(bid).success).toBe(true);
  });

  it("rejects bid missing required fields", () => {
    expect(ClawdBidSchema.safeParse({ bid_id: "x" }).success).toBe(false);
    expect(ClawdBidSchema.safeParse({}).success).toBe(false);
  });
});
