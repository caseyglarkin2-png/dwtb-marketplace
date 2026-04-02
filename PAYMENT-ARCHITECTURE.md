# DWTB?! Studios — Payment + Contracting Architecture

## Panel Design: Payment Infrastructure × Contract Law × Sales Operations

---

## 1. ARCHITECTURE DECISION

### Stripe Product Choice: **Stripe Invoicing API**

**Why Invoicing, not the alternatives:**

| Option | Verdict | Reason |
|--------|---------|--------|
| Checkout Sessions | ❌ Rejected | Designed for instant e-commerce. Buyer clicks → pays → done. DWTB's flow is bid → Casey reviews → accepts → THEN pay. Checkout sessions expire in 24h, can't be pre-created during bid and held for days. |
| Payment Links | ❌ Rejected | Static URLs with fixed amounts. Can't programmatically generate per-bid, can't track which bid maps to which payment, can't enforce 50/50 split schedule. |
| Stripe Connect | ❌ Rejected | Marketplace model where you take a cut between buyers/sellers. DWTB is the seller. No marketplace intermediation needed. Massive overkill. |
| **Invoicing API** | ✅ Selected | **Purpose-built for B2B.** Casey reviews bid → accepts → Stripe creates Invoice 1 (50%) and schedules Invoice 2 (50% due May 15). Invoices have built-in payment pages, email delivery, PDF generation, due dates, and auto-reminders. Feels institutional. $0.50/paid invoice (free tier: first 25/month). |

**Key Invoicing API capabilities that map perfectly:**

1. **Deferred creation** — Invoice doesn't exist until Casey accepts the bid. No premature payment artifacts.
2. **Due dates** — Invoice 1: `due_date = acceptance + 7 days`. Invoice 2: `due_date = 2026-05-15`.
3. **Hosted payment page** — Each invoice gets a Stripe-hosted URL. Client clicks → pays via card/ACH/wire. No custom payment UI needed.
4. **Auto-reminders** — Stripe emails the client at due date, 3 days before, 7 days overdue. Zero Casey effort.
5. **Webhooks** — `invoice.paid`, `invoice.payment_failed`, `invoice.overdue` drive the state machine.
6. **PDF receipts** — Stripe generates professional invoice PDFs automatically.
7. **Customer objects** — One Stripe Customer per bidder company. Reusable if they come back.

### Payment Timing in the Flow

```
Bidder submits bid + signs contract
        │
        ▼
   Clawd: lead created (status: "submitted")
   Audit: bid_submitted + contract_signed
   Email: Casey notified
        │
        ▼
   Casey reviews in admin panel
        │
        ├── Decline → email bidder, done
        ├── Waitlist → email bidder, hold
        │
        └── Accept ──┐
                      ▼
              Stripe: Create Customer (if new)
              Stripe: Create Invoice 1 (50%, due in 7 days)
              Stripe: Create Invoice 2 (50%, due May 15, DRAFT — finalized later)
              Clawd: lead status → "accepted"
              Clawd: store stripe_customer_id, invoice_1_id, invoice_2_id
              Email: bidder gets acceptance + Invoice 1 link
                      │
                      ▼
              Bidder pays Invoice 1 via Stripe hosted page
              Webhook: invoice.paid → Clawd status → "payment_1_complete"
              Invoice 2 auto-finalizes on May 1 (or on demand)
                      │
                      ▼
              Bidder pays Invoice 2 (due May 15)
              Webhook: invoice.paid → Clawd status → "fully_paid"
              Onboarding begins
```

### Where Payment State Lives

**Stripe is the source of truth for payment state. Clawd is the source of truth for bid/contract state.**

| Data | Lives In | Why |
|------|----------|-----|
| Bid details (name, company, amount, contract) | Clawd (lead record) | Submitted before Stripe is involved |
| Contract + signature hash | Clawd meta + audit log | Legal record, not a payment concept |
| Stripe Customer ID | Clawd lead.meta | Links bid to Stripe customer |
| Invoice IDs | Clawd lead.meta | Links bid to Stripe invoices |
| Invoice payment status | **Stripe** (queried live) | Stripe is canonical for "did they pay" |
| Bid workflow status | Clawd lead.status | `submitted → accepted → payment_1_complete → fully_paid → onboarded` |
| Refund status | Stripe | Refunds happen via Stripe dashboard or API |

**No database needed.** Clawd stores the bid/contract record with Stripe IDs in `meta`. When you need payment status, query Stripe. When webhooks fire, update Clawd.

---

## 2. FLOW REDESIGN

### Complete UX Flow: Landing → Paid → Onboarded

#### Phase 1: Bid Submission (EXISTS — minor changes)

```
Step 1: Offering Review (no change)
  └── Read contract terms, see slot availability

Step 2: Details + Amount (no change)
  └── Name, title, company, email, bid amount, optional note

Step 3: Contract Review + E-Sign (no change)
  └── 10-section contract, consent checkboxes, typed name, canvas signature

Step 4: Submit (minor change)
  └── POST /api/bids → Clawd lead + audit + email
  └── Response includes bid_id
  └── Redirect to /partners/confirmation?ref={bid_id}&email={email}
```

**What changes in the existing bid form:** Almost nothing. The bid form is a *letter of intent*, not a payment form. Payment happens after acceptance. The only change: the confirmation page gets a real status tracker instead of a static page.

#### Phase 2: Casey Reviews (admin panel — needs rewrite)

```
Admin Dashboard (/admin)
  └── View all bids from Clawd pipeline
  └── For each bid:
      ├── [Accept] → triggers Stripe invoice creation
      ├── [Decline] → sends decline email
      └── [Waitlist] → sends waitlist email
```

**What happens when Casey clicks Accept:**

1. `PATCH /api/admin/bids/[id]/status` with `{ status: "accepted" }`
2. Server creates Stripe Customer (idempotent on email)
3. Server creates Invoice 1: 50% of bid amount, due in 7 days
4. Server creates Invoice 2: 50% of bid amount, due May 15 (saved as draft)
5. Server updates Clawd lead: `status: "accepted"`, stores Stripe IDs in meta
6. Server sends acceptance email to bidder with Invoice 1 payment link
7. Audit: `bid_accepted` entry

#### Phase 3: Payment Collection (NEW — Stripe handles UX)

```
Bidder receives email:
  "Your Q2 2026 partnership has been approved.
   Investment: $15,000
   Invoice #1 (50%): $7,500 — Due April 14, 2026
   [Pay Invoice →] (Stripe hosted invoice page)"

Bidder clicks → Stripe hosted payment page
  └── Card, ACH, or wire transfer
  └── Stripe handles 3D Secure, retries, receipts

Webhook: invoice.paid
  └── POST /api/webhooks/stripe
  └── Update Clawd: status → "payment_1_complete"
  └── Email Casey: "Invoice 1 paid by {company}"
  └── Audit: payment_received
```

#### Phase 4: Second Payment (automated)

```
~May 1: Server finalizes Invoice 2 (or do it at acceptance)
  └── Stripe auto-emails invoice to client
  └── Due: May 15, 2026

Client pays → Webhook: invoice.paid
  └── Update Clawd: status → "fully_paid"
  └── Email Casey: "Fully paid — ready for onboarding"
  └── Audit: payment_received
```

#### Phase 5: Bidder Status Page (confirmation page rewrite)

```
/partners/confirmation?ref={bid_id}&email={email}

Displays live status from Clawd + Stripe:
  ┌─────────────────────────────────────────┐
  │  Q2 2026 Partnership — Status           │
  │                                         │
  │  Reference: BID-7f3a...                 │
  │  Company: Acme Freight                  │
  │  Amount: $15,000                        │
  │                                         │
  │  ● Submitted ✓       Mar 28 2:14 PM     │
  │  ● Accepted ✓        Mar 29 10:00 AM    │
  │  ● Invoice 1 Paid ✓  Apr 2 3:22 PM      │
  │  ○ Invoice 2 Due     May 15, 2026       │
  │  ○ Onboarding        Pending            │
  │                                         │
  │  [Download Signed Contract (PDF)]       │
  │  [View Invoice 1]  [View Invoice 2]     │
  └─────────────────────────────────────────┘
```

---

## 3. STATUS STATE MACHINE

```
submitted ──→ accepted ──→ payment_1_complete ──→ fully_paid ──→ onboarded
    │              │
    ├── declined   ├── payment_overdue (auto, from webhook)
    ├── waitlisted │
    └── expired    └── cancelled (manual, triggers refund)
```

### Valid Transitions

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted:            ["accepted", "declined", "waitlisted", "expired"],
  waitlisted:           ["accepted", "declined"],
  accepted:             ["payment_1_complete", "payment_overdue", "cancelled"],
  payment_1_complete:   ["fully_paid", "payment_overdue", "cancelled"],
  payment_overdue:      ["payment_1_complete", "fully_paid", "cancelled"],
  fully_paid:           ["onboarded", "cancelled"],
  onboarded:            ["cancelled"],
  declined:             [],
  expired:              [],
  cancelled:            [],
};
```

### Audit Events to Add

```typescript
type AuditEventType =
  | "bid_submitted"       // existing
  | "contract_signed"     // existing
  | "bid_accepted"        // admin accepts
  | "bid_declined"        // admin declines
  | "bid_waitlisted"      // admin waitlists
  | "payment_received"    // stripe webhook
  | "payment_failed"      // stripe webhook
  | "payment_overdue"     // stripe webhook
  | "invoice_created"     // on acceptance
  | "invoice_voided"      // on cancellation
  | "refund_issued"       // manual
  | "onboarding_started"; // manual
```

---

## 4. IMPLEMENTATION SPRINT

### Pre-requisite: Stripe Account Setup (manual, 15 min)
- Create Stripe account (or use existing)
- Enable Invoicing in Stripe Dashboard
- Get API keys → add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to Vercel env vars
- Configure webhook endpoint: `https://dwtb-marketplace.vercel.app/api/webhooks/stripe`
- Subscribe to events: `invoice.paid`, `invoice.payment_failed`, `invoice.overdue`, `invoice.voided`

---

### Task 1: Install Stripe SDK
- **File:** `package.json`
- **What:** `npm install stripe`
- **Dependencies:** None
- **Size:** S

---

### Task 2: Stripe Client Library
- **File:** `src/lib/stripe.ts` (NEW)
- **What:** Stripe SDK initialization + helper functions
- **Dependencies:** Task 1
- **Size:** M

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil", // latest stable
  typescript: true,
});

// Create or retrieve a Stripe customer by email (idempotent)
export async function getOrCreateCustomer(params: {
  email: string;
  name: string;
  company: string;
}): Promise<Stripe.Customer> {
  const existing = await stripe.customers.list({
    email: params.email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      company: params.company,
      source: "dwtb_marketplace",
    },
  });
}

// Create a payable invoice for a specific amount
export async function createInvoice(params: {
  customerId: string;
  amount: number; // in dollars
  description: string;
  dueDate: Date;
  metadata: Record<string, string>;
  autoFinalize?: boolean;
}): Promise<Stripe.Invoice> {
  // Create invoice item first
  await stripe.invoiceItems.create({
    customer: params.customerId,
    amount: Math.round(params.amount * 100), // cents
    currency: "usd",
    description: params.description,
  });

  // Create and optionally finalize the invoice
  const invoice = await stripe.invoices.create({
    customer: params.customerId,
    collection_method: "send_invoice",
    due_date: Math.floor(params.dueDate.getTime() / 1000),
    metadata: params.metadata,
    auto_advance: true, // auto-send reminders
  });

  if (params.autoFinalize !== false) {
    return stripe.invoices.finalizeInvoice(invoice.id);
  }

  return invoice;
}

// Send a finalized invoice to the customer
export async function sendInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  return stripe.invoices.sendInvoice(invoiceId);
}

// Retrieve invoice with payment status
export async function getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  return stripe.invoices.retrieve(invoiceId);
}

// Void an unpaid invoice (for cancellations)
export async function voidInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  return stripe.invoices.voidInvoice(invoiceId);
}
```

---

### Task 3: Clawd Client Extensions
- **File:** `src/lib/clawd.ts` (MODIFY)
- **What:** Add functions to update lead status and meta (for storing Stripe IDs)
- **Dependencies:** None
- **Size:** S

```typescript
// Add to existing clawd.ts:

export async function updateLead(
  leadId: string,
  data: { status?: string; meta?: Record<string, unknown> }
): Promise<ClawdLead> {
  return clawdFetch<ClawdLead>(`/api/intake/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getLead(leadId: string): Promise<ClawdLead> {
  return clawdFetch<ClawdLead>(`/api/intake/leads/${leadId}`);
}
```

> **Note:** This assumes Clawd supports `PATCH /api/intake/leads/:id` and `GET /api/intake/leads/:id`. If it doesn't, add those endpoints to the Railway service. Alternatively, use the pipeline deal endpoints if leads don't support updates — the key requirement is: store `stripe_customer_id`, `invoice_1_id`, `invoice_2_id` somewhere retrievable by bid ID.

---

### Task 4: Stripe Webhook Handler
- **File:** `src/app/api/webhooks/stripe/route.ts` (NEW)
- **What:** Receives Stripe events, updates Clawd status
- **Dependencies:** Tasks 2, 3
- **Size:** L

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { updateLead } from "@/lib/clawd";
import { appendAuditEntry } from "@/lib/audit";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const bidId = invoice.metadata?.bid_id;
      const invoiceNumber = invoice.metadata?.invoice_number; // "1" or "2"

      if (!bidId) break;

      const newStatus = invoiceNumber === "2" ? "fully_paid" : "payment_1_complete";

      await updateLead(bidId, { status: newStatus });
      await appendAuditEntry({
        eventType: "payment_received",
        entityType: "invoice",
        entityId: invoice.id,
        payload: {
          bid_id: bidId,
          invoice_number: invoiceNumber,
          amount: (invoice.amount_paid ?? 0) / 100,
          stripe_invoice_id: invoice.id,
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const bidId = invoice.metadata?.bid_id;
      if (!bidId) break;

      await appendAuditEntry({
        eventType: "payment_failed",
        entityType: "invoice",
        entityId: invoice.id,
        payload: {
          bid_id: bidId,
          amount: (invoice.amount_due ?? 0) / 100,
        },
      });
      break;
    }

    case "invoice.overdue": {
      const invoice = event.data.object as Stripe.Invoice;
      const bidId = invoice.metadata?.bid_id;
      if (!bidId) break;

      await updateLead(bidId, { status: "payment_overdue" });
      await appendAuditEntry({
        eventType: "payment_overdue",
        entityType: "invoice",
        entityId: invoice.id,
        payload: { bid_id: bidId },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

### Task 5: Rewrite Admin Status Transition (remove Supabase)
- **File:** `src/app/api/admin/bids/[id]/status/route.ts` (REWRITE)
- **What:** Replace Supabase calls with Clawd + Stripe. On "accepted", create Stripe customer + invoices.
- **Dependencies:** Tasks 2, 3
- **Size:** L

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/admin-auth";
import { getLead, updateLead } from "@/lib/clawd";
import { getOrCreateCustomer, createInvoice, sendInvoice, voidInvoice } from "@/lib/stripe";
import { appendAuditEntry } from "@/lib/audit";

const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted:          ["accepted", "declined", "waitlisted", "expired"],
  waitlisted:         ["accepted", "declined"],
  accepted:           ["payment_1_complete", "cancelled"],
  payment_1_complete: ["fully_paid", "cancelled"],
  payment_overdue:    ["payment_1_complete", "fully_paid", "cancelled"],
  fully_paid:         ["onboarded", "cancelled"],
  onboarded:          ["cancelled"],
  declined:           [],
  expired:            [],
  cancelled:          [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await validateAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bidId } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const newStatus = body.status;
  if (!newStatus || typeof newStatus !== "string") {
    return NextResponse.json({ error: "Status required" }, { status: 400 });
  }

  // Fetch bid from Clawd
  let lead;
  try {
    lead = await getLead(bidId);
  } catch {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  // Validate transition
  const allowedNext = VALID_TRANSITIONS[lead.status];
  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return NextResponse.json(
      { error: "INVALID_TRANSITION", message: `Cannot go from '${lead.status}' to '${newStatus}'` },
      { status: 400 }
    );
  }

  // On acceptance: create Stripe customer + invoices
  if (newStatus === "accepted") {
    const bidAmount = (lead.meta?.bid_amount as number) || 0;
    const half = Math.round(bidAmount / 2);

    // Create Stripe customer
    const customer = await getOrCreateCustomer({
      email: lead.email,
      name: lead.name,
      company: lead.company,
    });

    // Invoice 1: 50% due in 7 business days
    const due1 = new Date();
    due1.setDate(due1.getDate() + 10); // ~7 business days
    const inv1 = await createInvoice({
      customerId: customer.id,
      amount: half,
      description: `DWTB?! Studios — Q2 2026 Partnership (Payment 1 of 2)`,
      dueDate: due1,
      metadata: { bid_id: bidId, invoice_number: "1" },
    });

    // Invoice 2: 50% due May 15 (created as draft, finalized later)
    const due2 = new Date("2026-05-15T00:00:00Z");
    const inv2 = await createInvoice({
      customerId: customer.id,
      amount: bidAmount - half, // handles odd amounts
      description: `DWTB?! Studios — Q2 2026 Partnership (Payment 2 of 2)`,
      dueDate: due2,
      metadata: { bid_id: bidId, invoice_number: "2" },
      autoFinalize: false, // keep as draft until ~May 1
    });

    // Send invoice 1
    await sendInvoice(inv1.id);

    // Store Stripe IDs in Clawd
    await updateLead(bidId, {
      status: "accepted",
      meta: {
        ...lead.meta,
        stripe_customer_id: customer.id,
        invoice_1_id: inv1.id,
        invoice_1_url: inv1.hosted_invoice_url,
        invoice_2_id: inv2.id,
        accepted_at: new Date().toISOString(),
      },
    });

    await appendAuditEntry({
      eventType: "bid_accepted",
      entityType: "bid",
      entityId: bidId,
      payload: {
        stripe_customer_id: customer.id,
        invoice_1_id: inv1.id,
        invoice_2_id: inv2.id,
        bid_amount: bidAmount,
      },
    });

    // Send acceptance email with payment link
    await sendAcceptanceEmail(lead, inv1.hosted_invoice_url || "");

    return NextResponse.json({
      status: "accepted",
      invoice_1_url: inv1.hosted_invoice_url,
      invoice_2_id: inv2.id,
    });
  }

  // On cancellation: void unpaid invoices
  if (newStatus === "cancelled") {
    const inv1Id = lead.meta?.invoice_1_id as string;
    const inv2Id = lead.meta?.invoice_2_id as string;
    if (inv1Id) {
      try { await voidInvoice(inv1Id); } catch { /* already paid or voided */ }
    }
    if (inv2Id) {
      try { await voidInvoice(inv2Id); } catch { /* already paid or voided */ }
    }
  }

  // Generic status update
  await updateLead(bidId, { status: newStatus });
  await appendAuditEntry({
    eventType: `bid_${newStatus}` as any,
    entityType: "bid",
    entityId: bidId,
    payload: { previous_status: lead.status },
  });

  return NextResponse.json({ status: newStatus });
}

async function sendAcceptanceEmail(lead: any, paymentUrl: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const amount = (lead.meta?.bid_amount as number) || 0;
  const half = Math.round(amount / 2);

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "DWTB?! Studios <partnerships@dwtb.dev>",
      to: [lead.email],
      subject: "Your Q2 2026 Partnership Has Been Approved — DWTB?! Studios",
      text: [
        `${lead.name},`,
        "",
        `Your allocation request for a Q2 2026 GTM Partnership has been approved.`,
        "",
        `Investment: $${amount.toLocaleString()}`,
        `Payment 1 of 2: $${half.toLocaleString()} — due within 7 business days`,
        `Payment 2 of 2: $${(amount - half).toLocaleString()} — due May 15, 2026`,
        "",
        `Pay Invoice #1:`,
        paymentUrl,
        "",
        `Once payment is received, we'll begin onboarding immediately.`,
        "",
        `— Casey Glarkin`,
        `DWTB?! Studios`,
      ].join("\n"),
    }),
  }).catch(console.error);
}
```

---

### Task 6: Rewrite Bid Status Endpoint (real data)
- **File:** `src/app/api/bids/status/route.ts` (REWRITE)
- **What:** Fetch real bid data from Clawd + Stripe invoice status
- **Dependencies:** Tasks 2, 3
- **Size:** M

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getLead } from "@/lib/clawd";
import { getInvoice } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const email = searchParams.get("email");

  if (!ref || !email) {
    return NextResponse.json(
      { error: "Both ref and email are required" },
      { status: 400 }
    );
  }

  let lead;
  try {
    lead = await getLead(ref);
  } catch {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  // Verify email matches (privacy: don't leak bid data to wrong person)
  if (lead.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  // Enrich with Stripe invoice status if available
  let invoice1Status = null;
  let invoice1Url = null;
  let invoice2Status = null;
  let invoice2Url = null;

  if (lead.meta?.invoice_1_id) {
    try {
      const inv1 = await getInvoice(lead.meta.invoice_1_id as string);
      invoice1Status = inv1.status;
      invoice1Url = inv1.hosted_invoice_url;
    } catch { /* invoice not found */ }
  }

  if (lead.meta?.invoice_2_id) {
    try {
      const inv2 = await getInvoice(lead.meta.invoice_2_id as string);
      invoice2Status = inv2.status;
      invoice2Url = inv2.hosted_invoice_url;
    } catch { /* invoice not found */ }
  }

  return NextResponse.json({
    bid_id: lead.id,
    status: lead.status,
    company: lead.company,
    bid_amount: lead.meta?.bid_amount || null,
    contract_version: lead.meta?.contract_version || null,
    submitted_at: lead.created_at,
    accepted_at: lead.meta?.accepted_at || null,
    signed_at: lead.meta?.signed_at || null,
    invoice_1: invoice1Status ? {
      status: invoice1Status,
      url: invoice1Url,
    } : null,
    invoice_2: invoice2Status ? {
      status: invoice2Status,
      url: invoice2Url,
    } : null,
  });
}
```

---

### Task 7: Receipt / Contract PDF Endpoint (real data)
- **File:** `src/app/api/bids/receipt/[id]/route.ts` (REWRITE)
- **What:** Generate signed contract PDF from Clawd bid data
- **Dependencies:** Task 3
- **Size:** M

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getLead } from "@/lib/clawd";
import { generateContractPdf } from "@/lib/pdf";
import { getContractSections } from "@/lib/contract-text";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = new URL(request.url).searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  let lead;
  try {
    lead = await getLead(id);
  } catch {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  if (lead.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  const bidAmount = (lead.meta?.bid_amount as number) || 0;
  const signedAt = (lead.meta?.signed_at as string) || lead.created_at;
  const contractVersion = (lead.meta?.contract_version as string) || "Q2-2026-v1.0";

  const sections = getContractSections({
    bidderName: lead.name,
    bidderTitle: (lead.meta?.bidder_title as string) || "",
    bidderCompany: lead.company,
    bidAmount,
    date: new Date(signedAt).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    }),
  });

  const contractText = sections
    .map((s) => `${s.number}. ${s.title}\n\n${s.body}`)
    .join("\n\n");

  const pdf = generateContractPdf({
    contractText,
    bidderName: lead.name,
    bidderCompany: lead.company,
    bidAmount,
    signedAt,
    bidId: id,
    signatureHash: "See audit trail for integrity hash",
    contractVersion,
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="DWTB-Q2-2026-Contract-${id.slice(0, 8)}.pdf"`,
    },
  });
}
```

---

### Task 8: Admin Notify Rewrite (remove Supabase)
- **File:** `src/app/api/admin/bids/[id]/notify/route.ts` (REWRITE)
- **What:** Replace Supabase with Clawd for bid lookup
- **Dependencies:** Task 3
- **Size:** S

---

### Task 9: Confirmation Page Rewrite
- **File:** `src/app/partners/confirmation/page.tsx` (REWRITE)
- **What:** Real status tracker with timeline, invoice links, PDF download
- **Dependencies:** Tasks 6, 7
- **Size:** L

---

### Task 10: Environment Variables
- **File:** Vercel Dashboard (manual)
- **What:** Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Dependencies:** Stripe account setup
- **Size:** S

---

### Task 11: Remove Supabase + PG Dependencies
- **File:** `package.json`, delete `src/lib/supabase/` if exists
- **What:** `npm uninstall @supabase/supabase-js pg @types/pg`
- **Dependencies:** Tasks 5, 8 (must rewrite Supabase-dependent routes first)
- **Size:** S

---

### Sprint Summary

| # | Task | File | Size | Depends On |
|---|------|------|------|------------|
| 1 | Install Stripe SDK | package.json | S | — |
| 2 | Stripe client library | src/lib/stripe.ts | M | 1 |
| 3 | Clawd client extensions | src/lib/clawd.ts | S | — |
| 4 | Stripe webhook handler | src/app/api/webhooks/stripe/route.ts | L | 2, 3 |
| 5 | Admin status rewrite | src/app/api/admin/bids/[id]/status/route.ts | L | 2, 3 |
| 6 | Bid status endpoint | src/app/api/bids/status/route.ts | M | 2, 3 |
| 7 | Receipt PDF endpoint | src/app/api/bids/receipt/[id]/route.ts | M | 3 |
| 8 | Admin notify rewrite | src/app/api/admin/bids/[id]/notify/route.ts | S | 3 |
| 9 | Confirmation page | src/app/partners/confirmation/page.tsx | L | 6, 7 |
| 10 | Env vars | Vercel | S | Stripe account |
| 11 | Remove Supabase | package.json + delete | S | 5, 8 |

**Critical path:** 1 → 2 → (4, 5, 6 in parallel) → 9

---

## 5. WHAT MAKES IT FEEL LEGIT

### The $15K Trust Gap

A VP of Marketing will not enter a credit card on a page that feels like a side project. Here's what bridges that gap:

#### Visual Cues

1. **Stripe's hosted invoice page IS legitimate.** You don't build a custom payment form. The client receives a Stripe invoice email (from stripe.com domain) and pays on `invoice.stripe.com`. This is the same payment experience they use for their own SaaS vendors. Instantly credible.

2. **Contract PDF with integrity hash.** The downloadable PDF has a SHA-256 hash in the footer, e-sign timestamp, and "Electronically signed under ESIGN Act / UETA" verbiage. This looks like a DocuSign output, not a toy.

3. **Status timeline, not a status badge.** The confirmation page should show a vertical timeline (like a FedEx tracking page) with timestamps for each phase. A single "Submitted" badge feels static. A timeline with dates and checkmarks feels alive and institutional.

4. **Reference number formatting.** Don't show raw UUIDs. Format as `DWTB-Q2-7F3A` (prefix + quarter + first 4 chars of ID). Short, memorable, referenceable in an email thread.

#### Information Architecture

5. **Separate "Offering" from "Order."** The landing page is the offering memorandum. The bid form is the order ticket. The confirmation page is the trade confirmation. The invoice is the settlement. Use financial language consistently.

6. **Invoice email should come from Stripe, not you.** Stripe sends professional invoice emails with "Pay Invoice" buttons. These look like real business invoices because they ARE real business invoices. Don't try to replicate this in Resend.

7. **Confirmation email from Casey is the relationship layer.** Resend email says "Your partnership has been approved" with a personal tone. Stripe email says "Invoice #INV-0001 from DWTB?! Studios — $7,500.00 due April 14." One is the relationship, the other is the instrument. Both arrive. Neither alone is enough.

#### Trust Signals

8. **"Powered by Stripe" in the flow.** When a client sees Stripe's logo on the payment page, they know their card data is handled by a PCI-compliant processor. Don't hide this — it's a trust signal worth millions.

9. **Contract version number in footer.** `Q2-2026-v1.0` on the contract, in the PDF, in the confirmation email. This signals "this is a versioned, maintained legal instrument" not a one-off.

10. **Cancellation terms visible.** The contract already has Section 8 (Termination with 30 days notice, prorated refund). This actually increases trust — it shows there's an exit ramp. Amateurs hide cancellation terms. Professionals make them clear.

#### Receipt / Confirmation Design

11. **The confirmation page should have 3 columns of state:**

```
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│  CONTRACT    │  │  PAYMENTS    │  │  ONBOARDING  │
│  ✓ Signed    │  │  ✓ Inv #1    │  │  ○ Kickoff   │
│  ✓ Hash OK   │  │  ○ Inv #2    │  │  ○ Slack     │
│  [Download]  │  │  [Pay Now]   │  │  ○ Dashboard │
└─────────────┘  └──────────────┘  └──────────────┘
```

12. **The bid amount should always appear formatted exactly the same way.** `$15,000.00` — never `$15000`, never `15000`, never `$15,000`. Two decimal places. Dollar sign. Commas. Consistency signals precision.

---

## 6. STRIPE WEBHOOK EVENTS TO HANDLE

| Event | Action |
|-------|--------|
| `invoice.paid` | Update Clawd status (payment_1_complete or fully_paid). Email Casey. Audit entry. |
| `invoice.payment_failed` | Audit entry. Email Casey. (Don't auto-change status — Stripe retries.) |
| `invoice.overdue` | Update Clawd status → payment_overdue. Email Casey. |
| `invoice.voided` | Audit entry. (Happens when admin cancels.) |
| `customer.created` | No action needed (we create the customer, so we already know). |

---

## 7. E-SIGN COMPLIANCE NOTES (Expert 2)

**What currently holds up in court:**
- ✅ Two-checkbox consent (reviewed terms + consent to e-sign)
- ✅ Typed name matching bidder name
- ✅ Canvas signature capture
- ✅ SHA-256 integrity hash binding all terms
- ✅ Timestamp (ISO 8601)
- ✅ IP address + User Agent in audit trail

**What to add for belt-and-suspenders:**
- Store the complete contract text (all 10 sections, interpolated) in Clawd meta at time of signing. This makes the hash independently verifiable — you can re-hash and compare.
- Store the signature canvas data (base64 PNG) in Clawd meta. Currently it's submitted but not persisted.
- Add the raw audit log to Clawd (currently console.log only). This is the single biggest compliance gap — your audit trail evaporates on every deployment.

**Stripe invoices are separate legal instruments.** The signed contract says "50% on acceptance, 50% May 15." The Stripe invoices are the *payment collection mechanism* for that obligation. The contract is the binding agreement; the invoices are the execution. Both together form a complete paper trail.

---

## 8. CRITICAL BUGS TO FIX FIRST

Before building payment, fix these load-bearing issues:

1. **`src/app/api/admin/bids/[id]/status/route.ts` imports `createServiceClient` from `@/lib/supabase/server`** — this file likely doesn't exist. This route is dead. Must be rewritten (Task 5).

2. **`src/app/api/admin/bids/[id]/notify/route.ts` same problem** — imports Supabase. Dead route (Task 8).

3. **`package.json` still lists `@supabase/supabase-js` and `pg`** — cargo from a previous architecture. Remove after rewriting dependent routes (Task 11).

4. **`appendAuditEntry` is console.log only** — audit trail is not persisted. For legal compliance, audit entries should be appended to Clawd (perhaps a `/api/audit` endpoint that writes to a JSONL file on the Railway volume). This is not blocking for payment, but is the #1 thing a lawyer would flag.

5. **Bid submission doesn't store signature_data or full contract text in Clawd** — the signed contract data exists only in the HTTP request/response. After the bid is submitted, the signature PNG and interpolated contract text are gone. Store both in `lead.meta`.

---

## 9. EXECUTION ORDER (2-Day Sprint)

### Day 1 (Foundation)
- [ ] Morning: Tasks 1-3 (Stripe SDK, client lib, Clawd extensions) — 2 hours
- [ ] Midday: Task 4 (Webhook handler) + Task 5 (Admin status rewrite) — 3 hours
- [ ] Afternoon: Task 6 (Bid status) + Task 7 (Receipt PDF) + Task 8 (Admin notify) — 2 hours
- [ ] Evening: Task 11 (Remove Supabase) + verify build — 30 min

### Day 2 (UX + Integration)
- [ ] Morning: Task 9 (Confirmation page rewrite) — 3 hours
- [ ] Midday: Task 10 (Env vars) + Stripe webhook registration + end-to-end test — 2 hours
- [ ] Afternoon: Fix bid submission to persist signature_data + contract text in Clawd meta — 1 hour
- [ ] Evening: Audit trail persistence (stretch goal) — 2 hours

---

## 10. API ENDPOINT SUMMARY

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/bids` | Public (rate limited) | Submit bid + signed contract |
| GET | `/api/bids/status?ref=&email=` | Public | Bidder checks their status |
| GET | `/api/bids/receipt/[id]?email=` | Public | Download signed contract PDF |
| POST | `/api/webhooks/stripe` | Stripe signature | Payment event handler |
| GET | `/api/admin/bids` | Admin | List all bids |
| PATCH | `/api/admin/bids/[id]/status` | Admin | Accept/decline/transition bid |
| POST | `/api/admin/bids/[id]/notify` | Admin | Resend notification |

No new infrastructure. No new databases. Stripe + Clawd + Resend. Ship it.
