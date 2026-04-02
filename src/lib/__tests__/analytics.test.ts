import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock navigator.sendBeacon
const mockSendBeacon = vi.fn();
Object.defineProperty(globalThis, "navigator", {
  value: { sendBeacon: mockSendBeacon },
  writable: true,
});

describe("analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSendBeacon.mockClear();
  });

  it("exports track function", async () => {
    const { track } = await import("../analytics");
    expect(typeof track).toBe("function");
  });

  it("track does not throw for valid events", async () => {
    const { track } = await import("../analytics");
    expect(() => {
      track("page_load", { expired: false });
      track("cta_click", { location: "hero" });
      track("bid_start");
    }).not.toThrow();
  });
});
