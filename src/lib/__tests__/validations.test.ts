import { describe, it, expect } from "vitest";
import { bidSubmissionSchema } from "../validations";

describe("validations", () => {
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

  it("accepts valid bid submission", () => {
    const result = bidSubmissionSchema.safeParse(validBid);
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      bidder_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      bidder_email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative bid amount", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      bid_amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects consent = false", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      consent_given: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty signature", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      signature_data: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid idempotency key", () => {
    const result = bidSubmissionSchema.safeParse({
      ...validBid,
      idempotency_key: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
