import { describe, it, expect } from "vitest";
import { generateSignatureHash } from "../crypto";

describe("crypto", () => {
  it("generates deterministic SHA-256 hash", async () => {
    const params = {
      contractVersion: "Q2-2026-v1.0",
      bidId: "test-bid-123",
      signerName: "Jane Doe",
      signerEmail: "jane@acme.com",
      bidAmount: 25000,
      typedName: "Jane Doe",
      signedAt: "2026-04-02T12:00:00.000Z",
    };

    const hash1 = await generateSignatureHash(params);
    const hash2 = await generateSignatureHash(params);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different hashes for different inputs", async () => {
    const base = {
      contractVersion: "Q2-2026-v1.0",
      bidId: "test-bid-123",
      signerName: "Jane Doe",
      signerEmail: "jane@acme.com",
      bidAmount: 25000,
      typedName: "Jane Doe",
      signedAt: "2026-04-02T12:00:00.000Z",
    };

    const hash1 = await generateSignatureHash(base);
    const hash2 = await generateSignatureHash({
      ...base,
      bidAmount: 30000,
    });

    expect(hash1).not.toBe(hash2);
  });
});
