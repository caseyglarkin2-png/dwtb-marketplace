import { describe, it, expect } from "vitest";
import { bidSubmissionSchema } from "../validations";

describe("input sanitization", () => {
  const validBid = {
    bidder_name: "Jane Doe",
    bidder_title: "VP Marketing",
    bidder_company: "Acme Freight",
    bidder_email: "jane@acme.com",
    bid_amount: 25000,
    typed_name: "Jane Doe",
    consent_given: true as const,
    signature_data: "data:image/png;base64," + "A".repeat(200),
    idempotency_key: "12345678-1234-4234-a234-123456789012",
  };

  it("strips HTML tags from bidder_name", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      bidder_name: '<script>alert("xss")</script>Jane',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bidder_name).not.toContain("<script>");
      expect(result.data.bidder_name).toContain("Jane");
    }
  });

  it("strips HTML tags from bidder_company", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      bidder_company: '<img src=x onerror=alert(1)>Acme Co',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bidder_company).not.toContain("<img");
      expect(result.data.bidder_company).toContain("Acme Co");
    }
  });

  it("strips HTML tags from note", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      note: 'Hello <b>world</b> <a href="javascript:alert()">click</a>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).not.toContain("<b>");
      expect(result.data.note).not.toContain("<a");
      expect(result.data.note).toContain("Hello");
      expect(result.data.note).toContain("world");
    }
  });

  it("rejects excessively long name", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      bidder_name: "A".repeat(300),
    });
    expect(result.success).toBe(false);
  });

  it("rejects excessively long note", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      note: "A".repeat(2100),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for idempotency_key", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      idempotency_key: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects excessively large signature data", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      signature_data: "A".repeat(500001),
    });
    expect(result.success).toBe(false);
  });
});
