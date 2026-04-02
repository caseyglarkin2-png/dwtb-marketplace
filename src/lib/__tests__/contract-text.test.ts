import { describe, it, expect } from "vitest";
import { renderContractText, getContractVersion } from "../contract-text";

describe("contract-text", () => {
  it("returns correct contract version", () => {
    expect(getContractVersion()).toBe("Q2-2026-v1.0");
  });

  it("renders contract with interpolated values", () => {
    const text = renderContractText({
      bidderName: "Jane Doe",
      bidderTitle: "VP Marketing",
      bidderCompany: "Acme Freight",
      bidAmount: 25000,
      date: "April 2, 2026",
    });

    expect(text).toContain("Jane Doe");
    expect(text).toContain("VP Marketing");
    expect(text).toContain("Acme Freight");
    expect(text).toContain("$25,000");
    expect(text).toContain("April 2, 2026");
    expect(text).toContain("Q2-2026-v1.0");
    expect(text).toContain("ESIGN Act");
    expect(text).toContain("PARTNERSHIP AGREEMENT");
  });

  it("formats large bid amounts correctly", () => {
    const text = renderContractText({
      bidderName: "Test User",
      bidderTitle: "CEO",
      bidderCompany: "Test Co",
      bidAmount: 150000,
      date: "April 2, 2026",
    });

    expect(text).toContain("$150,000");
  });
});
