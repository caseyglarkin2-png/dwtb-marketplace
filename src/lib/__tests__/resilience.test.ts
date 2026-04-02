import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch + env
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
vi.stubEnv("RAILWAY_API_URL", "https://test-railway.example.com");
vi.stubEnv("RAILWAY_API_TOKEN", "test-token-123");

describe("Resilience: timeouts, retries, fallbacks", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("Timeout behavior", () => {
    it("aborts requests after timeout", async () => {
      mockFetch.mockImplementation(() => {
        const err = new DOMException("Aborted", "AbortError");
        return Promise.reject(err);
      });

      const { getSlots } = await import("@/lib/clawd");
      await expect(getSlots()).rejects.toThrow("timeout");
    });

    it("passes AbortSignal to fetch", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ slots: [], available: 0, held: 0, committed: 0, sold: 0, total: 0, access_mode: "private", quarter: "Q2-2026", price_monthly: 10000, engagement_months: 3 }),
      });

      const { getSlots } = await import("@/lib/clawd");
      await getSlots();

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.signal).toBeDefined();
      expect(callArgs.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("Retry behavior", () => {
    it("retries GET on 502/503/504", async () => {
      // First call: 503
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Service Unavailable"),
        headers: new Headers(),
      });
      // Retry: success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ slots: [], available: 0, held: 0, committed: 0, sold: 0, total: 0, access_mode: "private", quarter: "Q2-2026", price_monthly: 10000, engagement_months: 3 }),
      });

      const { getSlots } = await import("@/lib/clawd");
      const result = await getSlots();
      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("does NOT retry POST requests", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Service Unavailable"),
        headers: new Headers(),
      });

      const { createBid } = await import("@/lib/clawd");
      await expect(
        createBid({
          company: "Test",
          name: "Test",
          email: "test@test.com",
          title: "CEO",
          bid_amount: 7500,
          agreement_accepted: true,
          consent_hash: "hash",
        })
      ).rejects.toThrow("503");

      // Only 1 call — no retry
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("gives up after max retries", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        text: () => Promise.resolve("Bad Gateway"),
        headers: new Headers(),
      });

      const { getSlots } = await import("@/lib/clawd");
      await expect(getSlots()).rejects.toThrow("502");
      // Initial + 1 retry = 2 calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Fallback shape validation", () => {
    it("fallback slots match SlotsResponseSchema", async () => {
      const { SlotsResponseSchema } = await import("@/lib/api-types");
      const { FALLBACK_STATS, DEFAULT_TOTAL_SLOTS, DEFAULT_ACCEPTED_SLOTS, DEFAULT_MIN_BID, DEFAULT_MIN_INCREMENT, DEADLINE_UTC } = await import("@/lib/constants");

      // This is the shape returned when Railway is down
      const fallback = {
        total_slots: DEFAULT_TOTAL_SLOTS,
        remaining_slots: DEFAULT_TOTAL_SLOTS - DEFAULT_ACCEPTED_SLOTS,
        current_min_bid: DEFAULT_MIN_BID,
        min_increment: DEFAULT_MIN_INCREMENT,
        deadline: DEADLINE_UTC,
        manually_closed: false,
        _source: "fallback" as const,
      };

      expect(SlotsResponseSchema.safeParse(fallback).success).toBe(true);
      // Suppress unused warning
      void FALLBACK_STATS;
    });

    it("fallback stats match StatsResponseSchema", async () => {
      const { StatsResponseSchema } = await import("@/lib/api-types");
      const { FALLBACK_STATS } = await import("@/lib/constants");

      const fallback = {
        ...FALLBACK_STATS,
        asOf: null,
        _source: "fallback" as const,
      };

      expect(StatsResponseSchema.safeParse(fallback).success).toBe(true);
    });
  });
});

describe("Cache behavior", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns live on first fetch", async () => {
    const { cachedFetch, invalidateCache } = await import("@/lib/cache");
    invalidateCache();

    const result = await cachedFetch("test-key", async () => ({ value: 42 }));
    expect(result.source).toBe("live");
    expect(result.data).toEqual({ value: 42 });
  });

  it("returns cached on second fetch within freshMs", async () => {
    const { cachedFetch, invalidateCache } = await import("@/lib/cache");
    invalidateCache();

    const fetcher = vi.fn().mockResolvedValue({ value: 42 });

    await cachedFetch("test-key-2", fetcher, { freshMs: 60_000, staleMs: 300_000 });
    const result = await cachedFetch("test-key-2", fetcher, { freshMs: 60_000, staleMs: 300_000 });

    expect(result.source).toBe("cached");
    expect(fetcher).toHaveBeenCalledTimes(1); // Only called once
  });

  it("invalidateCache clears specific key", async () => {
    const { cachedFetch, invalidateCache } = await import("@/lib/cache");
    invalidateCache();

    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    await cachedFetch("clear-test", fetcher, { freshMs: 60_000, staleMs: 300_000 });

    invalidateCache("clear-test");

    fetcher.mockResolvedValue({ value: 2 });
    const result = await cachedFetch("clear-test", fetcher, { freshMs: 60_000, staleMs: 300_000 });

    expect(result.source).toBe("live");
    expect(result.data).toEqual({ value: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("invalidateCache() with no arg clears all", async () => {
    const { cachedFetch, invalidateCache } = await import("@/lib/cache");
    invalidateCache();

    await cachedFetch("a", async () => 1, { freshMs: 60_000, staleMs: 300_000 });
    await cachedFetch("b", async () => 2, { freshMs: 60_000, staleMs: 300_000 });

    invalidateCache();

    const fetcherA = vi.fn().mockResolvedValue(10);
    const fetcherB = vi.fn().mockResolvedValue(20);

    const ra = await cachedFetch("a", fetcherA, { freshMs: 60_000, staleMs: 300_000 });
    const rb = await cachedFetch("b", fetcherB, { freshMs: 60_000, staleMs: 300_000 });

    expect(ra.source).toBe("live");
    expect(rb.source).toBe("live");
  });
});
