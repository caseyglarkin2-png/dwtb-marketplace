import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock env
vi.stubEnv("RAILWAY_API_URL", "https://test-railway.example.com");
vi.stubEnv("RAILWAY_API_TOKEN", "test-token-123");

describe("clawdFetch", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("succeeds on 200 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });

    const { getSlots } = await import("@/lib/clawd");
    // getSlots calls clawdFetch internally
    // We need to test clawdFetch directly but it's not exported
    // So we test through getSlots which is a thin wrapper
    const result = await getSlots();
    expect(result).toEqual({ data: "test" });
    expect(mockFetch).toHaveBeenCalledOnce();

    // Verify token is sent
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers.Authorization).toBe("Bearer test-token-123");
    // Verify X-Request-ID is sent
    expect(callArgs[1].headers["X-Request-ID"]).toBeDefined();
    expect(callArgs[1].headers["X-Request-ID"]).toMatch(/^[0-9a-f]{8}$/);
  });

  it("throws on 401 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
      headers: new Headers(),
    });

    const { getSlots } = await import("@/lib/clawd");
    await expect(getSlots()).rejects.toThrow("Clawd 401");
  });

  it("throws on 500 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
      headers: new Headers(),
    });

    const { getSlots } = await import("@/lib/clawd");
    await expect(getSlots()).rejects.toThrow("Clawd 500");
  });

  it("throws on timeout (AbortError)", async () => {
    mockFetch.mockImplementationOnce(() => {
      const err = new DOMException("Aborted", "AbortError");
      return Promise.reject(err);
    });
    // Reject retry too
    mockFetch.mockImplementationOnce(() => {
      const err = new DOMException("Aborted", "AbortError");
      return Promise.reject(err);
    });

    const { getSlots } = await import("@/lib/clawd");
    await expect(getSlots()).rejects.toThrow("timeout");
  });

  it("throws on network error", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

    const { getSlots } = await import("@/lib/clawd");
    await expect(getSlots()).rejects.toThrow("fetch failed");
  });

  it("logs never contain env var values", async () => {
    const consoleSpy = vi.spyOn(console, "warn");
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: () => Promise.resolve("Service Unavailable"),
      headers: new Headers(),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: () => Promise.resolve("Service Unavailable"),
      headers: new Headers(),
    });

    const { getSlots } = await import("@/lib/clawd");
    await expect(getSlots()).rejects.toThrow();

    // Check no log contains the token
    for (const call of consoleSpy.mock.calls) {
      const logContent = call.join(" ");
      expect(logContent).not.toContain("test-token-123");
      expect(logContent).not.toContain("test-railway.example.com");
    }
  });
});

describe("checkClawdConnection", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns connected: true when Railway responds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          slots: [],
          available: 3,
          held: 0,
          committed: 0,
          sold: 0,
          total: 3,
          access_mode: "private",
          quarter: "Q2-2026",
          price_monthly: 10000,
          engagement_months: 3,
        }),
    });

    const { checkClawdConnection } = await import("@/lib/clawd");
    const result = await checkClawdConnection();
    expect(result.connected).toBe(true);
    expect(result.latency).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
  });

  it("returns connected: false when Railway fails", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

    const { checkClawdConnection } = await import("@/lib/clawd");
    const result = await checkClawdConnection();
    expect(result.connected).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it("measures latency", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          slots: [],
          available: 0,
          held: 0,
          committed: 0,
          sold: 0,
          total: 0,
          access_mode: "private",
          quarter: "Q2-2026",
          price_monthly: 10000,
          engagement_months: 3,
        }),
    });

    const { checkClawdConnection } = await import("@/lib/clawd");
    const result = await checkClawdConnection();
    expect(typeof result.latency).toBe("number");
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });
});
