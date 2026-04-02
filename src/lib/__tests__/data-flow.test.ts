import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SlotsStatusSchema,
  PipelineResponseSchema,
  BidsResponseSchema,
  SlotsResponseSchema,
  StatsResponseSchema,
} from "@/lib/api-types";

// Mock fetch + env
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
vi.stubEnv("RAILWAY_API_URL", "https://test-railway.example.com");
vi.stubEnv("RAILWAY_API_TOKEN", "test-token-123");

// Representative Railway API responses
const SLOTS_RESPONSE = {
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

const PIPELINE_RESPONSE = {
  deals: [],
  total: 47,
  stats: {
    total_deals: 47,
    by_stage: { lead: 17, qualified: 0, proposal: 30, negotiation: 0, closed_won: 0, closed_lost: 0 },
    total_pipeline_value: 485000,
    active_pipeline_value: 485000,
    won_value: 0,
    won_count: 0,
    lost_count: 0,
    win_rate_pct: 0,
    stages: ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"],
    stage_labels: { lead: "Lead", proposal: "Proposal" },
  },
};

const BIDS_RESPONSE = {
  total: 1,
  bids: [
    {
      bid_id: "test-bid-1",
      company: "Acme Freight",
      name: "Jane Doe",
      email: "jane@acme.com",
      title: "VP Marketing",
      bid_amount: 10000,
      message: "Tier: growth",
      status: "pending",
      agreement_accepted: true,
      consent_hash: "abc123",
      submitted_at: "2026-04-02T00:00:00Z",
      updated_at: "2026-04-02T00:00:00Z",
    },
  ],
};

describe("Data Flow: Railway → Clawd → Route Handler → Frontend", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("Slots flow", () => {
    it("getSlots returns data that validates against SlotsStatusSchema", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(SLOTS_RESPONSE),
      });

      const { getSlots } = await import("@/lib/clawd");
      const raw = await getSlots();

      // Railway response validates
      const parsed = SlotsStatusSchema.safeParse(raw);
      expect(parsed.success).toBe(true);

      // Transformed to frontend shape
      if (parsed.success) {
        const frontend = {
          total_slots: parsed.data.total,
          remaining_slots: parsed.data.available,
          current_min_bid: 7500,
          min_increment: 500,
          deadline: "2026-04-07T03:59:00Z",
          manually_closed: false,
          _source: "live" as const,
        };
        expect(SlotsResponseSchema.safeParse(frontend).success).toBe(true);
      }
    });
  });

  describe("Pipeline/Stats flow", () => {
    it("getPipeline returns data that validates and transforms to StatsResponse", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(PIPELINE_RESPONSE),
      });

      const { getPipeline } = await import("@/lib/clawd");
      const raw = await getPipeline();

      const parsed = PipelineResponseSchema.safeParse(raw);
      expect(parsed.success).toBe(true);

      if (parsed.success) {
        const s = parsed.data.stats;
        const frontend = {
          proposalsSent: s.by_stage.proposal ?? 0,
          totalViews: s.total_deals,
          viewRate: s.total_deals > 0 ? Math.round(((s.by_stage.proposal ?? 0) / s.total_deals) * 100) : 0,
          pipelineValue: s.total_pipeline_value,
          strikeNow: s.by_stage.lead ?? 0,
          asOf: new Date().toISOString(),
          _source: "live" as const,
        };
        expect(StatsResponseSchema.safeParse(frontend).success).toBe(true);
        expect(frontend.proposalsSent).toBe(30);
        expect(frontend.pipelineValue).toBe(485000);
      }
    });
  });

  describe("Bids flow", () => {
    it("getBids returns data that validates against BidsResponseSchema", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(BIDS_RESPONSE),
      });

      const { getBids } = await import("@/lib/clawd");
      const result = await getBids();

      const parsed = BidsResponseSchema.safeParse(result);
      expect(parsed.success).toBe(true);
      expect(result.total).toBe(1);
      expect(result.bids[0].bid_id).toBe("test-bid-1");
    });

    it("createBid sends correct payload shape", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          bid_id: "new-bid",
          company: "Acme",
          name: "Jane",
          email: "jane@acme.com",
          title: "VP",
          bid_amount: 10000,
          message: "",
          status: "pending",
          agreement_accepted: true,
          consent_hash: "hash",
          submitted_at: "2026-04-02T00:00:00Z",
          updated_at: "2026-04-02T00:00:00Z",
        }),
      });

      const { createBid } = await import("@/lib/clawd");
      const result = await createBid({
        company: "Acme",
        name: "Jane",
        email: "jane@acme.com",
        title: "VP",
        bid_amount: 10000,
        agreement_accepted: true,
        consent_hash: "hash",
      });

      expect(result.bid_id).toBe("new-bid");
      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBe("POST");
      expect(call[0]).toContain("/api/marketplace/bid");
    });

    it("updateBid sends PATCH with status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ...BIDS_RESPONSE.bids[0], status: "accepted" }),
      });

      const { updateBid } = await import("@/lib/clawd");
      const result = await updateBid("test-bid-1", { status: "accepted" });

      expect(result.status).toBe("accepted");
      const call = mockFetch.mock.calls[0];
      expect(call[1].method).toBe("PATCH");
      expect(call[0]).toContain("/api/marketplace/bid/test-bid-1");
    });
  });

  describe("toBidRecord conversion", () => {
    it("maps ClawdBid fields to BidRecord fields", async () => {
      const { toBidRecord } = await import("@/lib/clawd");
      const record = toBidRecord(BIDS_RESPONSE.bids[0] as Parameters<typeof toBidRecord>[0]);

      expect(record.bid_id).toBe("test-bid-1");
      expect(record.bidder_name).toBe("Jane Doe");
      expect(record.bidder_email).toBe("jane@acme.com");
      expect(record.bidder_company).toBe("Acme Freight");
      expect(record.bid_amount).toBe(10000);
    });
  });
});
