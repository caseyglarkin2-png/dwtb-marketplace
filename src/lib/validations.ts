import { z } from "zod";

export const bidSubmissionSchema = z.object({
  bidder_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255),
  bidder_title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255),
  bidder_company: z
    .string()
    .min(2, "Company must be at least 2 characters")
    .max(255),
  bidder_email: z.string().email("Invalid email address").max(255),
  bid_amount: z.number().positive("Bid must be positive"),
  note: z.string().max(2000).optional(),
  // E-sign fields
  typed_name: z
    .string()
    .min(2, "Typed name must be at least 2 characters")
    .max(255),
  consent_given: z.literal(true, {
    message: "You must consent to the agreement",
  }),
  signature_data: z
    .string()
    .min(100, "Signature is required")
    .max(500000),
  idempotency_key: z.string().uuid("Invalid idempotency key"),
});

export type BidSubmission = z.infer<typeof bidSubmissionSchema>;

export const slotResponseSchema = z.object({
  total_slots: z.number(),
  remaining_slots: z.number(),
  current_min_bid: z.number(),
  min_increment: z.number(),
  deadline: z.string(),
  manually_closed: z.boolean(),
});

export type SlotResponse = z.infer<typeof slotResponseSchema>;
