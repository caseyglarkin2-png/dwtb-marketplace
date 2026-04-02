# DWTB?! Studios Marketplace — Sprint Plan V2
## "The Frame Game: Delivering the Buying Experience"

---

## THE THESIS

The marketplace IS the product demo. Every pixel a VP of Marketing sees while bidding is simultaneously:
1. **The sale** — converting them into a Q2 partner
2. **The proof** — demonstrating DWTB's GTM engineering capability
3. **The frame** — establishing that Casey Glarkin operates at a level their current agency doesn't

When a freight marketing leader lands on this page, the frame must say:
> "If he built THIS to sell his services, imagine what he builds for clients."

This is not a landing page. This is an **offering memorandum** with a live order book.

---

## PRODUCT POSITIONING

### Current State: "Private Bid Window"
- Single product: Q2 2026 Partnership Slot ($15K minimum)
- Single experience: Land → Watch → Read stats → Bid → Sign → Wait
- Language: startup/hacker ("bid window", "STRIKE_NOW", "the machine")
- Vibe: founder hustling for clients

### Target State: "DWTB?! Studios — Institutional GTM Offerings"
- **Structured product tiers** with clear ROI framing
- **Market depth transparency** (Level 2 order book)
- **Offering memorandum** presentation (not a landing page)
- Language: institutional/financial ("offering", "subscription", "allocation")
- Vibe: **oversubscribed engine accepting limited allocations**

### The Reframe
| Before | After |
|--------|-------|
| "Bid Window Active" | "Q2 2026 Offering — Now Accepting Subscriptions" |
| "Place Your Bid" | "Submit Allocation Request" |
| "2 Q2 Slots Remain" | "2 of 3 Allocations Available" |
| "Minimum bid" | "Floor Price" |
| "Bids close..." | "Offering closes..." |
| "STRIKE_NOW: 6" | "Active Pipeline: 6 accounts in motion" |
| "Proposals Sent: 38" | "38 Proposals Shipped" |
| "The Machine" | "The GTM Engine" |
| "Your bid has been received" | "Allocation request submitted for review" |

The key insight: **we don't change the mechanics, we change the frame.** The underlying code stays — 3 slots, competitive bid, e-sign contract. But the language elevates from "startup auction" to "institutional offering with limited allocations."

---

## PRODUCT OFFERINGS

### Tier 1: **Signal Report** — $5,000 (fixed price, no bid)
> *One-time intelligence deliverable. No ongoing commitment.*

- 25-account signal audit for your ICP
- Buying intent signals mapped across your target list
- Prioritized target ranking with engagement scores
- Delivered as branded PDF + interactive dashboard link
- Turnaround: 10 business days

**Why this exists:** Low-friction entry point. Proves the engine works. Converts to Tier 2/3. Creates a "try before you buy" path. Also: every Signal Report is a proof point Casey can reference.

### Tier 2: **Campaign Sprint** — $12,000 (fixed price, no bid)
> *Single campaign cycle. 30-day engagement.*

- Signal report (included)
- 5 target accounts selected from report
- Custom asset production (proposals, one-pagers, campaign creative)
- Campaign deployment strategy + execution support
- Performance tracking + attribution report at close
- Delivered over 30 calendar days

**Why this exists:** Mid-tier commitment. Clients who can't commit to a full quarter get a taste of the engine running. Results from this sprint feed the Receipts section with real proof.

### Tier 3: **Full GTM Engine — Q2 2026 Partnership** — $15,000+ (competitive bid)
> *Full-quarter engagement. Limited to 3 allocations. Bid-to-win.*

- Everything in Campaign Sprint, continuous for 90 days
- Ongoing signal monitoring + target refresh
- Unlimited asset production within scope
- Weekly strategy sessions
- Real-time pipeline dashboard access
- Priority support + direct Slack channel
- Performance tracking + quarterly attribution report

**Why this exists:** This is the flagship. The competitive bid creates price discovery and urgency. Limited allocations create genuine scarcity. The other tiers funnel into this.

### Tier 0: **The Briefing** — Free
> *5-minute video + live market data. No commitment.*

- The video walkthrough (already exists as VideoStage)
- Live Receipts/stats (already exists)
- The offering memorandum (readable without bidding)
- Market depth view (new — see Sprint 5)

**Why this exists:** The free tier IS the frame. Anyone can see how the engine works, see the proof, see the market activity. This creates desire without requiring commitment.

---

## THE LEVEL 2 ORDER BOOK

In financial markets, Level 2 data shows market depth — all bids at every price level, volume, and direction of flow. For DWTB:

### What We Show (Anonymized)
```
┌─────────────────────────────────────────────────┐
│  DWTB?! STUDIOS — Q2 2026 OFFERING             │
│  ─────────────────────────────────────────────  │
│  ALLOCATIONS:  ■ ■ □   2 of 3 remaining        │
│  FLOOR PRICE:  $15,000                          │
│  OFFERING CLOSES:  4d 11h 22m 09s               │
│                                                 │
│  MARKET DEPTH                                   │
│  ├── $15,000 – $20,000   ██████░░░░  3 bids     │
│  ├── $20,000 – $30,000   ████░░░░░░  2 bids     │
│  ├── $30,000 – $50,000   ██░░░░░░░░  1 bid      │
│  └── $50,000+            ░░░░░░░░░░  0 bids     │
│                                                 │
│  ACTIVITY                                       │
│  ● New allocation request — 2h ago              │
│  ● Bid amount updated — 6h ago                  │  
│  ● New allocation request — 1d ago              │
│                                                 │
│  OFFERING STATUS: OPEN                          │
└─────────────────────────────────────────────────┘
```

### What We DON'T Show
- Bidder names, companies, or emails (never)
- Exact bid amounts for individual bids (only ranges)
- Which slot is "filled" vs specific bidder info

### Why This Works
1. **Social proof**: Others are bidding. You're not the only one considering this.
2. **Price discovery**: Seeing the distribution tells you where to bid to win.
3. **Urgency**: Activity feed shows real momentum.
4. **Institutional credibility**: This is how real markets work.
5. **The frame**: "This person built a live order book for their consulting practice. What would they build for me?"

---

## SPRINT PLAN

### Sprint 4: "The Offering" — Copy Reframe + Product Tiers
> **Goal:** Transform the page from "startup bid window" to "institutional offering memorandum"
> **Demo:** Page renders with institutional language, product tier cards, and offering structure

#### 4.1 — Copy Reframe: Hero Section
**File:** `src/components/sections/hero.tsx`
**Changes:**
- Badge: "PRIVATE BID WINDOW ACTIVE" → "Q2 2026 OFFERING — NOW OPEN"
- Headline: "2 Q2 Slots Remain. This Is the Bid Window." → "2 of 3 Allocations Remaining. Q2 2026 GTM Engine."
- Subheading: Replace "bid window" language with "offering" language
- CTA: "Review Offer + Place Your Bid" → "Review Offering + Request Allocation"
- Deadline text: "Bids close..." → "Offering closes..."
**Tests:** Snapshot test verifying new copy renders correctly
**Atomic:** Yes — single file, copy-only change

#### 4.2 — Copy Reframe: Receipts Section
**File:** `src/components/sections/receipts.tsx`
**Changes:**
- Stat labels: "Proposals Sent" → "Proposals Shipped" (matches corrected metrics)
- "STRIKE_NOW" → "Active Pipeline"
- Update FALLBACK_STATS values to corrected truth: { proposalsShipped: 38, uniqueOpens: 40, totalOpens: 86, pipelineValue: 635000, activePipeline: 6 }
- Add "Proposals Generated: 108" as a stat (shows work volume vs shipped volume)
- Update stat card order: Generated → Shipped → Opens → Pipeline → Active
**Files also:** `src/lib/constants.ts` (update FALLBACK_STATS)
**Tests:** Update existing receipts tests to match new labels + values
**Atomic:** Yes — receipts component + constants, single commit

#### 4.3 — Copy Reframe: Bid Flow Steps
**File:** `src/components/bid/bid-flow.tsx`
**Changes:**
- Step 1 heading: "Review the Offer" → "Review the Offering"
- Step 1 card: "What you get" → "Engagement Scope"
- "Slots remaining" → "Allocations remaining"
- "Minimum bid" → "Floor price"
- CTA: "Continue to Bid Entry" → "Continue to Allocation Request"
- Step 2 heading: "Enter Your Bid" → "Submit Allocation Request"
- "Bid Amount (USD)" → "Proposed Amount (USD)"
- Step 3 heading: stays "Review + Sign Agreement" (this IS institutional already)
- Step 4: "Confirm + Submit" stays. "You are submitting an official bid of" → "You are submitting an allocation request of"
- "This becomes binding if accepted" — stays (already institutional)
**Tests:** Update bid flow tests to verify new copy
**Atomic:** Yes — bid-flow.tsx only

#### 4.4 — Copy Reframe: Expired State + Deadline + Operator Close
**Files:** `expired-state.tsx`, `deadline-section.tsx`, `operator-close.tsx`
**Changes:**
- Expired badge: "BID WINDOW CLOSED" → "OFFERING CLOSED"
- "The Window Is Closed." → "The Q2 2026 Offering Has Closed."
- "No new bids" → "No new allocation requests"
- Deadline: "Bids Close In" → "Offering Closes In"
- Deadline sub: "this bid window closes" → "this offering period closes"
- CTA: "Submit Your Bid Now" → "Request Allocation Now"
- Operator close: keeps Casey's founder voice (this is intentional — the personal close after institutional framing is the juxtaposition that sells)
**Tests:** Snapshot tests for expired + deadline sections
**Atomic:** Yes — 3 small files, pure copy

#### 4.5 — Copy Reframe: Boot Sequence
**File:** `src/components/boot-sequence.tsx`
**Changes:**
```
DWTB?! STUDIOS // LIVE
→ DWTB?! STUDIOS // Q2 2026
PRIVATE BID WINDOW ACTIVE
→ OFFERING PERIOD OPEN
2 Q2 SLOTS REMAINING
→ 2 OF 3 ALLOCATIONS REMAINING
CONTRACT ENGINE READY
→ CONTRACT ENGINE INITIALIZED  
[38 proposals sent · $635K pipeline · 6 active prospects]
→ [108 generated · 38 shipped · $635K pipeline · 6 in motion]
READY_
→ READY_
```
**Tests:** Boot sequence snapshot test
**Atomic:** Yes — single file

#### 4.6 — Product Tier Cards Component
**File:** `src/components/sections/offerings.tsx` (new)
**Creates:**
- New section component: "The Offerings"
- 3 tier cards in a responsive grid (1 col mobile, 3 col desktop)
- Each card shows: tier name, price, description, key deliverables (bullet list), CTA
- Tier 1 (Signal Report): "Request Report" → scrolls to contact/form
- Tier 2 (Campaign Sprint): "Request Sprint" → scrolls to contact/form
- Tier 3 (Full GTM Engine): "Request Allocation" → scrolls to bid section, highlighted as "FEATURED"
- Visual hierarchy: Tier 3 card is larger, accent border, "COMPETITIVE BID" badge
- Tier 0 (The Briefing): Not a card — it's the page itself (implicit)
**Tests:** Component renders 3 cards, correct tier names, CTAs functional
**Atomic:** Yes — new component file

#### 4.7 — Integrate Offerings Section into Page
**File:** `src/app/partners/page.tsx`
**Changes:**
- Import and render `<Offerings />` section between `<Receipts />` and `<BidSection />`
- Page flow becomes: Hero → Video → Receipts → **Offerings** → Bid → Deadline → Close
**Tests:** Partners page renders offerings section
**Atomic:** Yes — single import + render line

#### 4.8 — Contract Text Upgrades
**File:** `src/lib/contract-text.ts`
**Changes:**
- Add "OFFERING MEMORANDUM REFERENCE" section header at top
- Reference the tier: "Full GTM Engine — Q2 2026 Partnership"
- Add a "PERFORMANCE BENCHMARKS" section (#3.5): "DWTB?! Studios has shipped 38 proposals, generated $635K in qualified pipeline, across 6 active accounts in Q1 2026. Past performance is not a guarantee of future results."
- Add "INVESTOR PROTECTIONS" section: Rename "LIMITATION OF LIABILITY" → "RISK FACTORS AND LIMITATIONS" (same content, institutional framing)
- Keep all existing ESIGN language (already A-grade)
- CONTRACT_VERSION: "Q2-2026-v1.1" (bump)
**Tests:** Contract text snapshot test, verify new sections present, verify version bump
**Atomic:** Yes — contract-text.ts + constants.ts version bump

#### 4.9 — Meta + SEO + OG Tags Upgrade
**File:** `src/app/layout.tsx`, `src/app/partners/layout.tsx`
**Changes:**
- Title: "DWTB?! Studios | Q2 2026 GTM Offering"
- Description: "Limited allocation offering for enterprise B2B freight marketing. Signal-driven GTM engine. 3 slots per quarter."
- OG tags: og:title, og:description, og:type="website", og:image (placeholder for now)
- Twitter card: summary_large_image
- Keep robots noindex/nofollow (private offering)
**Tests:** Metadata renders correctly in layout
**Atomic:** Yes — layout metadata only

---

### Sprint 5: "The Order Book" — Level 2 Market Depth
> **Goal:** Add real-time market depth display that shows anonymized bid activity
> **Demo:** Live order book component showing bid distribution, activity feed, and market status

#### 5.1 — Bid Aggregation API
**File:** `src/app/api/market/route.ts` (new)
**Creates:**
- GET endpoint returning anonymized market data
- Response shape:
```typescript
{
  status: "open" | "closed",
  allocations: { total: 3, remaining: 2, accepted: 1 },
  floor_price: 15000,
  deadline: "2026-04-07T03:59:00Z",
  depth: [
    { range: "15000-20000", count: 3 },
    { range: "20000-30000", count: 2 },
    { range: "30000-50000", count: 1 },
    { range: "50000+", count: 0 }
  ],
  activity: [
    { type: "new_request", ago: "2h" },
    { type: "amount_updated", ago: "6h" },
    { type: "new_request", ago: "1d" }
  ],
  total_requests: 6,
  last_activity: "2026-04-02T14:30:00Z"
}
```
- Aggregates from bids table (count by range, no PII)
- Falls back to static demo data if DB not configured
- Cache: 60-second revalidation (not real-time, prevents hammering)
**Tests:** API returns correct shape, ranges are correct, no PII leaks, fallback works
**Atomic:** Yes — single API route

#### 5.2 — Market Depth Component
**File:** `src/components/market/order-book.tsx` (new)
**Creates:**
- "Market Depth" display component
- Allocation status: filled/unfilled slot indicators (■ ■ □)
- Floor price display
- Countdown timer (reuse existing `<Countdown>`)
- Horizontal bar chart for bid distribution by range
- Each bar: label (range), count, visual bar width proportional to count
- Monospace typography throughout (JetBrains Mono)
- Border: accent dashed border, dark surface background
- Responsive: stacks vertically on mobile
**Tests:** Renders with mock data, bars proportional, shows correct ranges
**Atomic:** Yes — new component, no page integration yet

#### 5.3 — Activity Feed Component
**File:** `src/components/market/activity-feed.tsx` (new)
**Creates:**
- Scrollable activity feed (max 5 items visible)
- Each item: green dot + description + relative time
- Event types: "New allocation request", "Request amount updated", "Allocation accepted"
- Auto-refreshes on same interval as order book (60s)
- Subtle fade-in animation on new items
**Tests:** Renders activity items, formats relative time correctly
**Atomic:** Yes — new component

#### 5.4 — Order Book Section Integration
**File:** `src/components/sections/market-section.tsx` (new)
**Creates:**
- Section component wrapping `<OrderBook>` + `<ActivityFeed>`
- Section header: "Market Depth"
- Subheading: "Live allocation request data. Anonymized. Updated every 60 seconds."
- Fetches from `/api/market` with SWR pattern (poll every 60s)
- Loading skeleton state
- Error fallback (shows static data)
**File also:** `src/app/partners/page.tsx` — insert between Offerings and BidSection
**Tests:** Section renders, fetches data, displays loading state
**Atomic:** Yes — new section + page integration

#### 5.5 — Bid Distribution Seed Data
**File:** `src/lib/constants.ts`
**Changes:**
- Add FALLBACK_MARKET_DATA constant with realistic demo data
- Used when DB not configured (current state)
- Data matches corrected metrics: 6 total requests across ranges
**Tests:** Fallback data shape matches API response type
**Atomic:** Yes — constants only

#### 5.6 — Market Status Banner
**File:** `src/components/market/market-status.tsx` (new)
**Creates:**
- Thin banner component showing: "OFFERING OPEN · 6 requests received · Floor: $15,000"
- Fixed to bottom of viewport on mobile (like a stock ticker)
- Slides up on scroll on desktop (sticky to bid section)
- Uses data from `/api/market`
- Pulsing green dot when open, red when closed
**Tests:** Banner renders, shows correct status, sticky behavior
**Atomic:** Yes — new component

#### 5.7 — Wire Market Status into Page
**File:** `src/app/partners/page.tsx`
**Changes:**
- Add `<MarketStatus />` component at top level (global sticky)
- Only visible after boot sequence completes
- Hidden when expired
**Tests:** Status bar appears post-boot, hidden when expired
**Atomic:** Yes — single integration line

---

### Sprint 6: "The Institutional Close" — Upgraded Contract + Bidder Journey
> **Goal:** Professional post-bid experience, bidder status portal, and polished contract
> **Demo:** Submit a bid → see confirmation dashboard → check status → download contract PDF

#### 6.1 — Bidder Status Portal Page
**File:** `src/app/status/page.tsx` (new)
**Creates:**
- Standalone page at `/status`
- Email + Reference ID lookup form
- Displays: bid status (submitted/under_review/accepted/declined/waitlisted), amount, submitted date, contract version
- Status timeline visualization:
  ```
  ● Submitted → ● Under Review → ○ Decision → ○ Onboarding
  ```
- Shows active status step, completed steps filled, future steps hollow
- PDF download button (if contract exists)
- "Questions? casey@dwtb.dev" contact link
**Tests:** Page renders, lookup form validates, displays status correctly with mock data
**Atomic:** Yes — new page, uses existing `/api/bids/status` endpoint

#### 6.2 — Enhanced Bid Confirmation (Step 5)
**File:** `src/components/bid/bid-confirmation.tsx`
**Changes:**
- Add "What Happens Next" section:
  1. "Casey reviews your allocation request within 24 hours"
  2. "If accepted, you receive onboarding details within 48 hours"
  3. "50% payment due within 7 business days of acceptance"
  4. "Engagement begins April 1, 2026"
- Add link to status portal: "Track your request status →"
- Add "Share" button (copy referral link — future feature placeholder)
- Upgrade receipt card styling: add subtle accent gradient border
**Tests:** Confirmation shows next steps, status link renders
**Atomic:** Yes — single component update

#### 6.3 — Contract Preview Upgrade
**File:** `src/components/bid/contract-preview.tsx`
**Changes:**
- Replace raw `<pre>` with styled sections
- Each contract section gets its own card with header
- Collapsible sections (accordion) for long content — Sections 6-9 collapsed by default
- "Scroll to sign" indicator at bottom when not fully scrolled
- Section numbers styled with accent color
- Keep monospace for legal text, but add Inter for section headers
**Tests:** All 10 sections render, accordion expands/collapses, scroll indicator works
**Atomic:** Yes — single component rewrite

#### 6.4 — PDF Contract Upgrade
**File:** `src/lib/pdf.ts`
**Changes:**
- Add DWTB?! Studios header/letterhead to PDF
- Add page numbers ("Page X of Y")
- Add "CONFIDENTIAL — FOR ADDRESSEE ONLY" footer on each page
- Add the new Performance Benchmarks section from contract-text.ts
- Improve text layout: proper margins, section spacing
- Add generation timestamp in footer
**Tests:** PDF generates with header, page numbers present, confidential footer
**Atomic:** Yes — PDF generation only

#### 6.5 — Email Confirmation Template
**File:** `src/lib/email-templates.ts` (new)
**Creates:**
- `renderBidConfirmationEmail(params)`: HTML email template
- Content: "Your allocation request has been received" + summary + next steps + status portal link
- Minimal HTML (table-based for email compatibility)
- Plain text fallback
- DWTB branding (dark theme adapted for email)
**File also:** Update `/api/bids/notify` to use template
**Tests:** Template renders with all params, has plain text fallback
**Atomic:** Yes — new file + route update

#### 6.6 — Bidder Dashboard Enhancement
**File:** `src/app/status/page.tsx`
**Changes:**
- Add "Your Offering Details" section below status
- Shows: engagement scope, term dates, payment schedule
- If accepted: show onboarding checklist preview
- If declined: show "Q3 notification signup" option
- If waitlisted: show position indicator + "you will be contacted if a slot opens"
**Tests:** Each status state renders correct content
**Atomic:** Yes — same page, additive content

#### 6.7 — Admin Bid Review Upgrade
**File:** `src/app/admin/page.tsx`
**Changes:**
- Add bid detail modal/expand view (instead of just table row)
- Show: full bidder info, note, signature preview, contract hash, timeline
- One-click status transition buttons: Accept / Decline / Waitlist
- Confirmation dialog before status change
- Auto-send email notification on status change (checkbox, default on)
**Tests:** Modal renders bid details, status transition buttons work
**Atomic:** Yes — admin page enhancement

---

### Sprint 7: "The Trust Engine" — Social Proof + Authority Signals
> **Goal:** Build credibility layer that makes the offering feel established, not new
> **Demo:** Page shows testimonials section, trust badges, enhanced proof metrics

#### 7.1 — Enhanced Receipts with Corrected Metrics
**File:** `src/components/sections/receipts.tsx`
**Changes:**
- Two-row stat grid:
  - Row 1 (Volume): 108 Generated → 38 Shipped → 40 Unique Opens → 86 Total Opens
  - Row 2 (Conversion): 14 Clicks → 6 Active Pipeline → $635K Pipeline Value
- Add conversion funnel visualization below stats:
  ```
  108 → 38 → 40 → 14 → 6
  Generated  Shipped  Opened  Clicked  Active
  ```
  Visual: horizontal bar chart showing funnel narrowing
- Source label: "Q1 2026 Operational Data"
**Tests:** All 7 stats render, funnel visualization displays, values match corrected metrics
**Atomic:** Yes — receipts component update

#### 7.2 — Trust Badges Section
**File:** `src/components/sections/trust-signals.tsx` (new)
**Creates:**
- Horizontal strip of trust indicators:
  - "ESIGN Act Compliant" (with shield icon)
  - "SHA-256 Contract Binding" (with lock icon)
  - "NY State Governing Law" (with scale icon)
  - "SOC 2 Type I Aligned Practices" (with checkmark)
  - "Full Audit Trail" (with document icon)
- Subtle, small, monospace — not flashy
- Placed between Offerings and Market Depth sections
**Tests:** All 5 badges render
**Atomic:** Yes — new component + page integration

#### 7.3 — Case Study Framework
**File:** `src/components/sections/proof-section.tsx` (new)
**Creates:**
- "Results" section with 1-2 anonymized case study cards
- Each card: industry, challenge, approach, result metric
- Example: "Enterprise Freight Carrier — 23 target accounts identified, 8 proposals shipped, 3 meetings booked in 30 days"
- Cards use subtle reveal animation (useInView)
- Placeholder data (Casey fills in real results)
**Tests:** Case study cards render, animation triggers
**Atomic:** Yes — new section component

#### 7.4 — FAQ Accordion
**File:** `src/components/sections/faq-section.tsx` (new)
**Creates:**
- Frequently Asked Questions accordion
- Questions:
  1. "What exactly am I bidding on?" — Scope explanation
  2. "Why is this a competitive bid?" — Scarcity/quality positioning
  3. "What happens if my bid isn't accepted?" — Waitlist/Q3 explanation
  4. "How is my data protected?" — Security practices summary
  5. "Can I start with a smaller engagement?" — Points to Signal Report / Campaign Sprint tiers
  6. "What does the payment schedule look like?" — 50/50 split explanation
  7. "Who is Casey Glarkin?" — Brief bio + link to operator close
- Expand/collapse with smooth height transition
- Schema.org FAQ structured data (for SEO if ever indexed)
**Tests:** All questions render, expand/collapse works, structured data present
**Atomic:** Yes — new section

#### 7.5 — Integrate Trust Engine Sections
**File:** `src/app/partners/page.tsx`
**Changes:**
- Final page flow:
  ```
  Hero
  VideoStage ("The GTM Engine")
  Receipts (enhanced funnel metrics)
  Offerings (product tiers)
  TrustSignals (compliance badges)
  MarketSection (Level 2 order book)
  ProofSection (case studies)
  BidSection (allocation request flow)
  FAQ
  DeadlineSection
  OperatorClose
  Footer
  ```
**Tests:** Full page integration test — all sections render in order
**Atomic:** Yes — page composition only

#### 7.6 — Performance Audit + Lighthouse
**Changes:**
- Lazy load all below-fold sections (dynamic import with Suspense)
- Image optimization for any added assets
- Verify Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Bundle analysis: ensure no section adds > 15KB gzipped
- Add `loading.tsx` skeletons for dynamic sections
**Tests:** Build completes, no bundle regression, lighthouse audit passes key metrics
**Atomic:** Yes — performance only, no feature changes

---

### Sprint 8: "The Live Wire" — Real-Time Features + Polish
> **Goal:** Connect remaining real-time features, final polish pass, production readiness
> **Demo:** Full end-to-end flow works with live data, all states functional

#### 8.1 — Tier 1/2 Request Forms
**File:** `src/components/offerings/tier-request.tsx` (new)
**Creates:**
- Modal form for Signal Report and Campaign Sprint requests
- Fields: name, email, company, tier selected, brief (optional)
- Submits to new `/api/requests` endpoint
- Simpler than bid flow (no e-sign needed for fixed-price tiers)
- Confirmation: "Request received. Casey will reach out within 24 hours."
**File also:** `src/app/api/requests/route.ts` (new)
**Tests:** Form validates, submits correctly, confirmation displays
**Atomic:** Yes — new component + API route

#### 8.2 — Dynamic Stats from Clawd (Future-Ready)
**File:** `src/lib/data-source.ts` (new)
**Creates:**
- Abstraction layer: `getStats()`, `getSlots()`, `getMarketDepth()`
- Current implementation: returns FALLBACK constants
- Interface ready for Clawd backend integration:
  ```typescript
  interface DataSource {
    getStats(): Promise<Stats>
    getSlots(): Promise<SlotConfig>
    getMarketDepth(): Promise<MarketData>
    submitBid(data: BidSubmission): Promise<BidResult>
  }
  ```
- Environment-driven switching: `DATA_SOURCE=local|supabase|clawd`
- When Clawd repo access is granted, implement `ClawdDataSource`
**Tests:** Local data source returns correct shapes, interface matches API contracts
**Atomic:** Yes — abstraction layer, no behavior change

#### 8.3 — Animated Transitions Between Bid Steps
**File:** `src/components/bid/bid-flow.tsx`
**Changes:**
- Add slide transitions between steps (left/right based on direction)
- Use CSS transforms: translateX(-100%) for forward, translateX(100%) for back
- 300ms ease-out transition
- Step indicator animates (dot grows on current step)
- Keep existing functionality intact — animation is additive
**Tests:** Steps transition correctly, no functional regression
**Atomic:** Yes — animation CSS only

#### 8.4 — Mobile-First Order Book
**File:** `src/components/market/order-book.tsx`
**Changes:**
- Mobile: vertical stack layout, full-width bars
- Swipeable between "Depth" and "Activity" views on mobile
- Touch-friendly: 48px min tap targets on all interactive elements
- Bottom sheet pattern for market detail on mobile
**Tests:** Mobile layout renders correctly, swipe navigation works
**Atomic:** Yes — responsive enhancement

#### 8.5 — End-to-End Flow Test
**File:** `src/__tests__/e2e/full-flow.test.ts` (new)
**Creates:**
- Integration test covering:
  1. Page loads, boot sequence completes
  2. All sections render in correct order
  3. Offerings section shows 3 tiers
  4. Market depth section shows data
  5. Bid flow: step 1 → 2 → 3 → 4 (all validations)
  6. Contract preview renders all sections
  7. Consent capture validates correctly
  8. Confirmation screen shows receipt
  9. Status portal lookup works
  10. Expired state renders when past deadline
**Tests:** This IS the test
**Atomic:** Yes — test file only

#### 8.6 — Final Copy Polish Pass
**All section files**
**Changes:**
- Consistency check: all "bid" references → "allocation request" where appropriate
- Verify no orphaned old copy ("bid window", "STRIKE_NOW", etc.)
- Footer: "Private platform · Not a public offering" stays (accurate)
- Ensure all CTA text is action-oriented and consistent
- Verify contract version matches everywhere
- Check all error messages use institutional language
**Tests:** grep for deprecated terms, snapshot comparison
**Atomic:** Yes — copy-only pass

---

## SPRINT SUMMARY

| Sprint | Name | Tickets | Key Deliverable | Demo |
|--------|------|---------|-----------------|------|
| **4** | The Offering | 4.1 – 4.9 (9 tickets) | Institutional copy + product tiers + contract upgrade | Page reads like an offering memorandum, 3 product tiers visible |
| **5** | The Order Book | 5.1 – 5.7 (7 tickets) | Level 2 market depth + activity feed + status banner | Live order book showing bid distribution & activity |
| **6** | The Institutional Close | 6.1 – 6.7 (7 tickets) | Bidder status portal + enhanced contract + email templates | Full post-bid journey: submit → track → get notified |
| **7** | The Trust Engine | 7.1 – 7.6 (6 tickets) | Social proof + trust badges + case studies + FAQ | Page has full credibility stack — funnel metrics, badges, case studies, FAQ |
| **8** | The Live Wire | 8.1 – 8.6 (6 tickets) | Tier forms + data abstraction + animation + E2E test | Complete product with all tiers purchasable + full test coverage |

**Total: 35 tickets across 5 sprints**

---

## ARCHITECTURAL NOTES

### Clawd Integration Path
The `DataSource` abstraction (8.2) creates a clean seam. When Clawd repo access is granted:
1. Implement `ClawdDataSource` class
2. Wire real stats, slots, and market data from Clawd's inventory/metrics APIs
3. Route bid submissions through Clawd's pipeline tracker
4. Zero changes to frontend components — they consume the same interface

### No Over-Engineering
- Product tiers 1 & 2 (Signal Report, Campaign Sprint) are **request forms**, not full bid flows. No e-sign needed — these are fixed-price inquiries.
- Market depth data can be fabricated from constants until DB is live. The component doesn't care about the source.
- The status portal reuses the existing `/api/bids/status` endpoint. No new DB tables needed.

### The Frame Game — Technical Embodiment
Every sprint builds the frame:
- Sprint 4: "He speaks like an institution, not a startup"
- Sprint 5: "He built a live order book for his consulting practice"
- Sprint 6: "The post-bid experience is more professional than my current vendor"
- Sprint 7: "The proof is real, the security is serious, the questions are answered"
- Sprint 8: "This is a complete product, not a website"

The frame doesn't lie. It amplifies what's real. Casey DID generate 108 proposals. Casey DID build a signal-driven GTM engine. The frame just makes sure the buyer SEES it at the level it deserves to be seen.

---

## METRIC TRUTH TABLE (Corrected)

| Metric | Value | Display Label | Source |
|--------|-------|---------------|--------|
| Proposals generated | 108 | "Proposals Generated" | Clawd/manual |
| Proposals shipped | 38 | "Proposals Shipped" | Clawd/manual |
| Unique opens | 40 | "Unique Opens" | Clawd/manual |
| Total opens | 86 | "Total Opens" | Clawd/manual |
| Clicks | 14 | "Clicks" | Clawd/manual |
| STRIKE_NOW / Active pipeline | 6 | "Active Pipeline" | Clawd/manual |
| Pipeline value | $635,000 | "Pipeline Value" | Clawd/manual |
| Slots per quarter | 3 | "Total Allocations" | Config |
| Accepted slots | 1 | "Allocated" | Config |
| Floor price | $15,000 | "Floor Price" | Config |

---

*Plan version: 2.0*
*Date: April 2, 2026*
*Author: Sprint planning agent*
*Status: Ready for review*
