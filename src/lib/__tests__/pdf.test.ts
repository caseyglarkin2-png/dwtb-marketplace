import { describe, it, expect } from "vitest";
import { generateContractPdf } from "../pdf";

describe("pdf", () => {
  it("generates a valid PDF buffer", () => {
    const pdf = generateContractPdf({
      contractText:
        "Q2 2026 PARTNERSHIP AGREEMENT\n\nThis is a test contract.\n\nSection 1: Terms\nThe parties agree to the terms.",
      bidderName: "John Doe",
      bidderCompany: "Acme Corp",
      bidAmount: 25000,
      signedAt: "2026-04-02T12:00:00Z",
      bidId: "12345678-1234-4234-a234-123456789012",
      signatureHash: "abc123def456",
      contractVersion: "Q2-2026-v1.0",
    });

    // Should return a typed array with content
    expect(pdf).toBeDefined();
    expect(pdf.length).toBeGreaterThan(100);
  });

  it("handles multi-page contracts", () => {
    // Generate a very long contract text
    const longText = Array(200)
      .fill("This is a line of contract text that should be wrapped properly.")
      .join("\n");

    const pdf = generateContractPdf({
      contractText: longText,
      bidderName: "Jane Smith",
      bidderCompany: "Big Corp",
      bidAmount: 100000,
      signedAt: "2026-04-02T12:00:00Z",
      bidId: "12345678-1234-4234-a234-123456789012",
      signatureHash: "abc123def456",
      contractVersion: "Q2-2026-v1.0",
    });

    expect(pdf).toBeDefined();
    expect(pdf.length).toBeGreaterThan(100);
    const text = new TextDecoder().decode(pdf);
    // Should have multiple pages (count /Type /Page occurrences)
    const pageCount = (text.match(/\/Type \/Page /g) || []).length;
    expect(pageCount).toBeGreaterThan(1);
  });
});
