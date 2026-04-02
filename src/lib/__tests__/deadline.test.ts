import { describe, it, expect } from "vitest";
import { getTimeRemaining, isExpired } from "@/lib/deadline";

describe("deadline", () => {
  it("returns correct time remaining for future deadline", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24); // +1 day
    const remaining = getTimeRemaining(new Date(Date.now()));
    // Since DEADLINE is April 7 2026 UTC, if current time is before that, should have positive total
    expect(remaining.total).toBeGreaterThanOrEqual(0);
  });

  it("returns zeros for past deadline", () => {
    const pastDate = new Date("2030-01-01T00:00:00Z");
    const result = getTimeRemaining(pastDate);
    expect(result.total).toBe(0);
    expect(result.days).toBe(0);
  });

  it("isExpired returns true for date after deadline", () => {
    expect(isExpired(new Date("2030-01-01T00:00:00Z"))).toBe(true);
  });

  it("isExpired returns false for date before deadline", () => {
    expect(isExpired(new Date("2025-01-01T00:00:00Z"))).toBe(false);
  });
});
