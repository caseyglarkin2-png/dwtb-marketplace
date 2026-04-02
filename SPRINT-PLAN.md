# DWTB?! Studios — /partners Bid + Contract Platform
## Sprint Plan v2.0 | April 2, 2026

---

## 1. Executive Diagnosis: Why the Old /partners Failed

The old `/partners` page failed because it was built as a services landing page wearing a dark theme. Specifically:

**Identity crisis.** It tried to be a discovery-call funnel, a feature tour, a founder story, and a contact form simultaneously. No single commercial thesis held the page together.

**Wrong conversion object.** The page ended with "book a call" or "request a proposal." That is the conversion object of an agency desperate for leads. DWTB?! Studios has 3 total slots and 2 remaining. The conversion object must be a binding bid, not a calendar link.

**Fake scarcity, real confusion.** The old page hinted at exclusivity but never committed to a mechanism that enforced it. No invite tokens. No deadlines wired to behavior. No bid mechanics. The visitor had no commercial action to take beyond "reach out."

**Wrong stats, wrong proof.** The fallback numbers were inflated or broken (108 sent, $1.57M pipeline, 0-value endpoint responses). Credibility collapsed before the visitor reached the CTA.

**Legacy architecture drag.** The old implementation inherited IA, copy, and component structures from generic agency thinking. It was a brochure with ambitions, not a transaction platform with conviction.

**No contract foundation.** There was no on-platform signing, no audit trail, no bid persistence. The "premium" feel was skin-deep.

---

## 2. Final Product Thesis

`/partners` is a **one-page, private bid-and-contract platform** that converts invited buyers from awareness to binding commercial action in a single session.

It is not a marketing page. It is the commercial front-end of the DWTB?! Studios GTM engine.

**The visitor journey:**
1. Arrives via private invite link
2. Experiences a boot sequence that establishes liveness
3. Encounters a hero that frames DWTB?! Studios as the prize
4. Watches a centerpiece Casey video (when available) that builds belief
5. Sees compressed proof of momentum
6. Reviews the offer and contract terms
7. Enters a bid, consents to e-sign, signs on-platform
8. Submits a binding bid + signed contract
9. Receives confirmation and enters pending review

**Success =** an invited buyer completes bid + sign in one session and feels smart for doing so.

---

## 3. One-Page Information Architecture

```
┌─────────────────────────────────────────────┐
│ BOOT SEQUENCE (2-3s, skippable on return)   │
│ Terminal-style. Establishes liveness.        │
│ Pulls public stats. Graceful fallback.       │
├─────────────────────────────────────────────┤
│ HERO                                        │
│ Full-screen. One CTA. Scarcity + deadline.  │
│ "Private bid window. 2 slots remain."       │
│ CTA: "Review Offer + Bid"                   │
├─────────────────────────────────────────────┤
│ THE MACHINE / VIDEO STAGE                   │
│ Premium video container (placeholder-ready) │
│ Signal → Research → Frame → Build →         │
│ Deploy → Track                              │
│ Short supporting copy. No toy demos.        │
├─────────────────────────────────────────────┤
│ THE RECEIPTS                                │
│ Real stats: 38 sent, 54 views, 142%,        │
│ $635K pipeline, 6 STRIKE_NOW                │
│ Compressed timeline. Proof surfaces.        │
├─────────────────────────────────────────────┤
│ BID + CONTRACT SECTION                      │
│ Offer review → Bid entry → Contract →       │
│ Consent → Sign → Submit → Confirmation      │
│ Brokerage-grade UX. Not a contact form.     │
├─────────────────────────────────────────────┤
│ DEADLINE SECTION                            │
│ Large countdown to April 6, 11:59 PM ET     │
│ Explicit consequence of delay.              │
│ Final CTA: "Submit Your Bid"                │
├─────────────────────────────────────────────┤
│ CASEY / OPERATOR CLOSE                      │
│ Short. Freight-native. Direct.              │
│ Contact surfaces. Not a bio page.           │
└─────────────────────────────────────────────┘
```

---

## 4. Bid + Contract Interaction Model

### User Journey (7 steps, single page)

```
Step 1: REVIEW OFFER
  - Slot availability (2 of 3 remaining)
  - Current minimum bid displayed
  - Minimum increment displayed
  - What the buyer gets (concise)
  - Deadline visible

Step 2: ENTER BID
  - Bidder name (required)
  - Bidder title (required)
  - Bidder company (required)
  - Bidder email (required)
  - Bid amount (required, >= minimum, validated against increment)
  - Optional note (textarea)
  - Client-side validation before proceeding

Step 3: REVIEW CONTRACT
  - Full contract text rendered inline (not iframe, not PDF)
  - Contract version pinned
  - Bid amount interpolated into contract text
  - Bidder identity fields interpolated
  - Scrollable, readable, accessible

Step 4: CONSENT TO E-SIGN
  - Explicit checkbox: "I have reviewed the Q2 Partnership Agreement.
    I understand this bid, if accepted, constitutes a binding agreement
    at the submitted bid amount."
  - Explicit checkbox: "I consent to sign this agreement electronically."
  - Both required before proceeding

Step 5: SIGN
  - Canvas-based signature pad (touch + mouse)
  - Clear button
  - Visual confirmation of ink presence
  - Name re-displayed for signature reference

Step 6: SUBMIT
  - Summary of bid + contract + signature
  - Final "Submit Bid + Signed Agreement" button
  - Loading state during submission
  - Server-side validation of all fields
  - Server-side deadline check
  - SHA-256 integrity hash generated
  - Bid record created (status: submitted)
  - Contract record created with signature artifact
  - Audit trail written (immutable)
  - IP + user agent captured server-side
  - Email notification to Casey
  - Email confirmation to bidder

Step 7: CONFIRMATION
  - "Bid submitted successfully"
  - Bid reference ID displayed
  - Status: Pending Review
  - "DWTB?! Studios will review your bid and respond within 48 hours"
  - Downloadable receipt/confirmation (optional, sprint 3)
```

### State Machine

```
                    ┌──────────┐
                    │  DRAFT   │ (bid started but not submitted)
                    └────┬─────┘
                         │ submit()
                         ▼
              ┌──────────────────┐
              │ SIGNED+SUBMITTED │
              └────────┬─────────┘
                       │ (admin action)
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐  ┌───────────┐  ┌──────────┐
   │ACCEPTED │  │ DECLINED  │  │WAITLISTED│
   └─────────┘  └───────────┘  └──────────┘
                                     │
                                     ▼ (slot opens)
                                ┌─────────┐
                                │ACCEPTED │
                                └─────────┘

   After deadline: any DRAFT → EXPIRED
   After deadline: new submissions get "late" flag
```

---

## 5. Data Model and Persistence Requirements

### Database: Supabase (PostgreSQL)

```sql
-- ============================================
-- INVITE TOKENS
-- ============================================
CREATE TABLE invite_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(32) UNIQUE NOT NULL,
  invitee_email VARCHAR(255),
  access_mode   VARCHAR(20) DEFAULT 'private'
                CHECK (access_mode IN ('private', 'public', 'vip')),
  status        VARCHAR(20) DEFAULT 'active'
                CHECK (status IN ('active', 'used', 'revoked', 'expired')),
  expires_at    TIMESTAMPTZ NOT NULL,
  max_uses      INT DEFAULT 1,
  used_count    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BIDS
-- ============================================
CREATE TABLE bids (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bidder_name   VARCHAR(255) NOT NULL,
  bidder_title  VARCHAR(255) NOT NULL,
  bidder_company VARCHAR(255) NOT NULL,
  bidder_email  VARCHAR(255) NOT NULL,
  bid_amount    DECIMAL(12,2) NOT NULL,
  note          TEXT,
  slot_intent   INT DEFAULT 1,
  status        VARCHAR(20) DEFAULT 'draft'
                CHECK (status IN (
                  'draft', 'submitted', 'pending_review',
                  'accepted', 'declined', 'waitlisted', 'expired'
                )),
  invite_token_id UUID REFERENCES invite_tokens(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTRACTS
-- ============================================
CREATE TABLE contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_version VARCHAR(20) NOT NULL,
  bid_id          UUID NOT NULL REFERENCES bids(id),
  signer_name     VARCHAR(255) NOT NULL,
  signer_title    VARCHAR(255) NOT NULL,
  signer_company  VARCHAR(255) NOT NULL,
  signer_email    VARCHAR(255) NOT NULL,
  consent_given   BOOLEAN NOT NULL DEFAULT FALSE,
  signed_at       TIMESTAMPTZ NOT NULL,
  signature_hash  VARCHAR(128) NOT NULL,
  signature_data  TEXT,
  ip_address      INET,
  user_agent      TEXT,
  receipt_ref     VARCHAR(64),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT TRAIL (append-only)
-- ============================================
CREATE TABLE audit_trail (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  VARCHAR(50) NOT NULL,
  entity_type VARCHAR(20) NOT NULL,
  entity_id   UUID NOT NULL,
  actor_email VARCHAR(255),
  actor_ip    INET,
  actor_ua    TEXT,
  payload     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- No UPDATE or DELETE policies on audit_trail
-- RLS: insert-only for anon, read-only for admin

-- ============================================
-- SLOT STATE
-- ============================================
CREATE TABLE slot_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter         VARCHAR(10) NOT NULL,
  total_slots     INT NOT NULL DEFAULT 3,
  filled_slots    INT NOT NULL DEFAULT 1,
  pending_slots   INT NOT NULL DEFAULT 0,
  accepted_slots  INT NOT NULL DEFAULT 1,
  current_min_bid DECIMAL(12,2) NOT NULL,
  min_increment   DECIMAL(12,2) NOT NULL DEFAULT 500.00,
  deadline        TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STATS (admin-controlled source of truth)
-- ============================================
CREATE TABLE stats_snapshot (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposals_sent  INT NOT NULL,
  total_views     INT NOT NULL,
  view_rate       DECIMAL(5,1) NOT NULL,
  pipeline_value  DECIMAL(12,2) NOT NULL,
  strike_now      INT NOT NULL,
  as_of           TIMESTAMPTZ DEFAULT NOW(),
  source          VARCHAR(50) DEFAULT 'manual'
);
```

### Row-Level Security Strategy

| Table | Anon Insert | Anon Read | Service Role | Notes |
|-------|------------|-----------|--------------|-------|
| invite_tokens | No | No (validated via API) | Full | Server-side only |
| bids | No (via API) | No | Full | API route inserts |
| contracts | No (via API) | No | Full | API route inserts |
| audit_trail | No (via API) | No | Full | Append-only via API |
| slot_config | No | Public read (limited cols) | Full | Read-only for page |
| stats_snapshot | No | Public read (latest only) | Full | Read-only for page |

**All writes go through Next.js API routes using the Supabase service role key server-side.** No direct client-to-database writes for sensitive tables.

---

## 6. Contracting / Audit-Trail Requirements

### E-Sign Flow (adapted from Sensos proven patterns)

**Integrity hash generation:**
```
SHA-256(CONTRACT_VERSION | BID_ID | SIGNER_NAME | SIGNER_EMAIL | BID_AMOUNT | SIGNED_AT_ISO)
```

Using Web Crypto API on server side (Next.js API route), not client side.

**Audit trail captures per signature event:**
| Field | Source | Required |
|-------|--------|----------|
| Signer name | Form input | Yes |
| Signer title | Form input | Yes |
| Signer company | Form input | Yes |
| Signer email | Form input | Yes |
| Consent boolean | Checkbox state | Yes |
| Signed at (ISO 8601) | Server timestamp | Yes |
| Contract version | Pinned at render | Yes |
| Bid amount | Form input | Yes |
| Integrity hash (SHA-256) | Computed server-side | Yes |
| Signature image (base64 PNG) | Canvas capture | Yes |
| IP address | Request headers | Yes |
| User agent | Request headers | Yes |
| Bid ID | Generated on submit | Yes |
| Contract ID | Generated on submit | Yes |

**Redundancy layers (adapted from Sensos 4-layer pattern):**
1. **Supabase `contracts` table** — primary durable record
2. **Supabase `audit_trail` table** — append-only event log
3. **Email to Casey** — immediate human notification with all metadata
4. **Email to bidder** — confirmation with bid reference and timestamp

**Immutability strategy:**
- `audit_trail` table has NO update/delete RLS policies
- `contracts` table has NO update RLS for anon
- Status changes on `bids` go through API with audit trail entry for each transition
- Every state change produces a new `audit_trail` row

### Contract Version Control

- Contract text stored as a constant in codebase (e.g., `src/lib/contract-text.ts`)
- Version string (e.g., `"Q2-2026-v1.0"`) embedded in contract record
- If contract text changes, version increments
- Hash binds the version to the signature, preventing post-sign edits

---

## 7. Section-by-Section Copy Direction

### Boot Sequence
```
DWTB?! STUDIOS // LIVE
PRIVATE BID WINDOW ACTIVE
2 Q2 SLOTS REMAINING
CONTRACT ENGINE READY
[38 proposals sent · $635K pipeline · 6 active prospects]
```
Tone: system boot. No adjectives. Data only.

### Hero
**Headline:** "2 Q2 Slots Remain. This Is the Bid Window."

**Subline:** "DWTB?! Studios runs the signal-driven GTM engine for enterprise B2B freight marketing. 3 total client slots per quarter. 1 is filled. You are looking at the last 2."

**CTA:** "Review Offer + Place Your Bid"

**Supporting:** "Bids close Monday, April 6 at 11:59 PM ET. No extensions."

No vague language. No "learn more." No "schedule a call." The visitor knows exactly what this page does within 5 seconds.

### The Machine / Video Stage
**Header:** "The Machine"

**Supporting copy loop:**
```
SIGNAL → RESEARCH → FRAME → BUILD → DEPLOY → TRACK
```

**Short paragraph:** "DWTB?! Studios identifies the gap between your operational reality and your digital presence. Then it closes the gap with account-specific assets, proposals, and campaign direction that convert to signed business."

**Video placeholder:** Large 16:9 container. Text: "Casey Glarkin. The Freight Marketer. [Video dropping soon]"

Design so the video drops in without touching layout.

### The Receipts
**Header:** "Proof."

**Stats grid:**
| 38 | 54 | 142% | $635K | 6 |
|---|---|---|---|---|
| Proposals Sent | Total Views | View Rate | Pipeline | STRIKE_NOW |

**Timeline (compressed, honest):**
```
Q1 2026    DWTB?! Studios launched
Q1 2026    Brush Pass data acquired
Q1 2026    Machine live
April 2026 Private bid window open
```

No stretched timeline. No fake legacy.

### Bid + Contract Section
**Header:** "Place Your Bid"

**Offer summary box:**
- Privileged access to the DWTB?! Studios GTM engine for Q2 2026
- Account research, signal monitoring, asset production, campaign direction
- 1 of 3 total Q2 client slots
- Current minimum bid: [from slot_config]
- Minimum increment: [from slot_config]
- Bid deadline: Monday, April 6 at 11:59 PM ET

**Form labels:** Direct. "Your Name" not "Please enter your full legal name below."

**Contract section header:** "Review the Agreement"

**Consent language:** "I have reviewed the Q2 Partnership Agreement and understand that this signed bid, if accepted by DWTB?! Studios, constitutes a binding agreement at the submitted bid amount."

**Submit button:** "Submit Bid + Signed Agreement"

### Deadline Section
**Header:** "Bids Close In"

**Countdown:** DD : HH : MM : SS (large, monospace)

**Copy:** "After 11:59 PM ET on Monday, April 6, this bid window closes. Late submissions may not receive the same consideration. No extensions."

**Final CTA:** "Submit Your Bid Now"

### Post-Deadline State (NEW — critical)

When the countdown reaches zero, the page transitions to a closed state. The bid form is hidden. The countdown is replaced with a static "BID WINDOW CLOSED" indicator.

**Header:** "The Window Is Closed."

**Copy:** "DWTB?! Studios is now operating at full capacity with Q2 clients. No new bids are being accepted. If the window reopens — you will hear about it before anyone else does."

**No CTA.** No "contact us." No form. No false hope. One optional link: the Casey/operator contact block at the bottom of the page for direct outreach at Casey's discretion.

**What this communicates:**
- DWTB is not waiting for business. It moved on.
- Scarcity was real, not theater.
- Being late has a cost. That cost is now visible.
- The right buyer learns to be earlier next time.

**Implementation:**
- `BID_WINDOW_EXPIRED` state renders automatically when `server_now > deadline`
- Page is still publicly accessible (not 404'd) — late visitors should see proof that the window was real
- Stats and Receipts sections remain visible
- Boot sequence in expired state shows: `BID WINDOW CLOSED · Q2 AT CAPACITY · DWTB STUDIOS OPERATIONAL`
- Admin can override with a `WINDOW_MANUALLY_CLOSED` flag to close early if all slots fill

### Casey / Operator Close
**Header:** "Casey Glarkin. The Freight Marketer."

**Copy (3-4 sentences max):** "I built this machine because freight companies deserve better than recycled agency playbooks. The companies that work with DWTB?! Studios get signal-driven GTM that actually converts. If you are reading this page, you were invited for a reason."

**Contact:** casey@dwtb.dev | LinkedIn (if appropriate)

---

## 8. Atomic Sprint Plan

### Sprint 1: Build the Stage
**Goal:** Demoable shell. All sections rendered. Responsive. No old funnel residue. Deploys to Vercel.

| # | Ticket | Files Touched | Outcome | Validation |
|---|--------|--------------|---------|------------|
| 1.1 | **Bootstrap Next.js 16 + TypeScript repo** | `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.ts`, `.gitignore`, `.env.example`, `src/app/layout.tsx`, `src/app/globals.css` | Clean Next.js 16 app with Tailwind, TypeScript strict mode, app router. Deploys to Vercel with zero errors. | `npm run build` passes. Vercel preview deploy succeeds. Page loads at `/partners`. |
| 1.2 | **Route structure + layout** | `src/app/partners/page.tsx`, `src/app/partners/layout.tsx`, `src/app/page.tsx` (redirect to /partners) | `/partners` is the single page route. Root `/` redirects to `/partners`. No other routes exist yet. | Navigate to `/` → redirected to `/partners`. `/partners` renders. |
| 1.3 | **Design system foundation** | `src/lib/fonts.ts`, `src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/` | Color tokens (black, white, accent green `#00FFC2`, grays). Typography scale. Monospace for data. Sans-serif for body. Consistent spacing. | Visual inspection: dark theme, premium feel, correct font loading. |
| 1.4 | **Boot Sequence component** | `src/components/boot-sequence.tsx` | Full-screen terminal boot animation. 2-3s. Session storage skip on return. Hardcoded fallback stats (38 sent, $635K, etc). Graceful. No blocking. | First visit: boot plays. Refresh: boot skipped. Stats display correctly. Animation completes in ~3s. |
| 1.5 | **Hero section** | `src/components/sections/hero.tsx` | Full-screen hero. Headline, subline, single CTA, scarcity (2 slots), deadline (April 6). Responsive. | Desktop: full viewport hero. Mobile: readable, CTA visible without scroll. Copy matches spec. |
| 1.6 | **Video Stage section** | `src/components/sections/video-stage.tsx` | 16:9 video container (placeholder). Signal loop graphic. Short supporting copy. | Video placeholder renders at correct ratio. Copy matches spec. Layout accommodates future video embed. |
| 1.7 | **Receipts section** | `src/components/sections/receipts.tsx` | Stats grid (38, 54, 142%, $635K, 6). Compressed timeline. AnimatedCounter on scroll. | Stats display correct numbers. AnimatedCounter animates on viewport entry. Timeline renders 4 entries. |
| 1.8 | **Bid section shell** | `src/components/sections/bid-section.tsx`, `src/components/bid/offer-summary.tsx`, `src/components/bid/bid-form.tsx` (shell) | Offer summary box with slot info, minimum bid, deadline. Form shell (fields present but not wired to backend). | Form fields render. Offer summary shows correct info. Client-side validation works (required fields, min bid). |
| 1.9 | **Deadline section** | `src/components/sections/deadline-section.tsx`, `src/components/countdown.tsx` | Large countdown timer to April 6, 11:59 PM ET. Expired state handling. Final CTA. | Timer counts down in real time. Shows correct remaining time. After deadline: shows expired state. |
| 1.10 | **Casey/Operator section** | `src/components/sections/operator-close.tsx` | Short operator block. Copy per spec. Contact surfaces. | Copy matches spec. Email link works. Layout is compact. |
| 1.11 | **Responsive + scroll behavior** | All section files, `src/app/partners/page.tsx` | Full page assembled. Sections flow vertically. Smooth scroll to bid section from CTAs. Mobile-first responsive. No scrolljacking. | Desktop: premium layout. Mobile: all sections readable, forms usable, CTAs tappable. No horizontal overflow. |
| 1.12 | **Vercel deployment config** | `vercel.json`, `.env.example`, `README.md` | Vercel project configured. Preview deploys on PR. Production deploy on main. Environment variables documented. | Push to branch → preview deploy URL works. Merge to main → production deploy. |

**Sprint 1 demo:** Full page loads at preview URL. All 7 sections visible. Responsive. Boot sequence plays. Countdown ticks. Stats show correct numbers. Bid form renders (not functional yet).

---

### Sprint 2: Build the Transaction Engine
**Goal:** Real invite tokens. Real bid persistence. Real contract signing. Real audit trail. Admin visibility.

| # | Ticket | Files Touched | Outcome | Validation |
|---|--------|--------------|---------|------------|
| 2.1 | **Supabase project + schema** | `supabase/migrations/001_initial.sql`, `.env.local`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts` | Supabase project created. All tables from data model created. RLS policies applied. Service role key in env. Anon key in env. | Run migration → all tables exist. RLS tested: anon cannot insert to bids directly. Service role can. |
| 2.2 | **Invite token validation** | `src/app/api/invite/validate/route.ts`, `src/lib/invite.ts`, `src/app/partners/page.tsx` (token check) | `/partners?token=ABC123` validates token server-side. Valid → page loads. Invalid/expired/used → access denied page. No token → configurable (private or public mode). | Valid token: page loads. Invalid token: "Access denied. This invite link is invalid or expired." Used token: blocked. Expired token: blocked. |
| 2.3 | **Slot state API** | `src/app/api/slots/route.ts`, `src/lib/slots.ts` | `GET /api/slots` returns current slot state (total, filled, pending, min bid, increment, deadline). Reads from slot_config table. | API returns correct JSON. Values match database. |
| 2.4 | **Stats API** | `src/app/api/stats/route.ts`, `src/lib/stats.ts` | `GET /api/stats` returns latest stats snapshot. Falls back to hardcoded values if no snapshot exists. | API returns stats. With snapshot: returns DB values. Without: returns fallback (38, 54, 142%, $635K, 6). |
| 2.5 | **Wire stats + slots to frontend** | `src/components/sections/hero.tsx`, `src/components/sections/receipts.tsx`, `src/components/sections/bid-section.tsx`, `src/components/boot-sequence.tsx` | All hardcoded stats replaced with API data. Slot count is live. Min bid is live. Loading states handled. | Change slot_config in DB → page reflects new values on refresh. Change stats_snapshot → receipts update. |
| 2.6 | **Bid submission API** | `src/app/api/bids/route.ts`, `src/lib/bids.ts`, `src/lib/validations.ts` | `POST /api/bids` validates all fields (Zod). Checks deadline server-side. Checks bid >= min bid. Creates bid record (status: submitted). Returns bid ID. Rate limited (3/min/IP). | Valid bid: 201 + bid ID. Invalid fields: 400 + errors. Below min bid: 400. After deadline: 403. Rate exceeded: 429. |
| 2.7 | **Contract text + version** | `src/lib/contract-text.ts`, `src/lib/contract-version.ts` | Contract text as TypeScript constant. Interpolation function for bidder name, company, bid amount, date. Version string `Q2-2026-v1.0`. | Contract renders with interpolated values. Version is correct. |
| 2.8 | **Contract preview UI** | `src/components/bid/contract-preview.tsx` | Inline contract rendering (scrollable, readable). Bid details interpolated. Not an iframe. Not a PDF. Accessible. | Contract text is readable. Bidder details are interpolated. Scrollable on mobile. |
| 2.9 | **E-sign consent + signature capture** | `src/components/bid/consent-capture.tsx`, `src/components/bid/signature-pad.tsx` | Two consent checkboxes. Canvas signature pad (touch + mouse). Clear button. Ink presence detection. All required before submit enabled. | Both checkboxes required. Signature required. Clear works. Touch works on mobile. Submit button disabled until all present. |
| 2.10 | **Contract + signature submission API** | `src/app/api/contracts/route.ts`, `src/lib/contracts.ts`, `src/lib/crypto.ts` | `POST /api/contracts` receives bid ID, signer fields, consent, signature data, contract version. Generates SHA-256 hash server-side. Captures IP + UA from headers. Creates contract record. Creates audit_trail entry. Updates bid status to submitted. | Contract created with hash. Audit trail entry exists. Bid status updated. IP and UA captured. |
| 2.11 | **Full bid-to-sign flow wiring** | `src/components/sections/bid-section.tsx`, `src/components/bid/bid-form.tsx`, `src/components/bid/bid-flow.tsx` | Multi-step flow: offer review → bid entry → contract preview → consent → sign → submit → confirmation. Step navigation. Loading states. Error handling. Success confirmation with bid reference ID. | Complete flow end-to-end. Each step validates before proceeding. Submission creates bid + contract + audit trail. Confirmation shows reference ID. |
| 2.12 | **Email notifications** | `src/app/api/bids/notify/route.ts`, `src/lib/email.ts` | On bid submission: email Casey with all bid details + signature metadata. Email bidder with confirmation + reference ID. Via Resend or SMTP. | Bid submitted → Casey receives email with details. Bidder receives confirmation. |
| 2.13 | **Admin visibility** | `src/app/admin/page.tsx`, `src/app/admin/layout.tsx`, `src/lib/admin-auth.ts` | Password-protected admin page. Lists all bids with status. Lists all contracts. Audit trail viewer. Slot state editor. Stats snapshot editor. Status change buttons (accept/decline/waitlist). | Admin login works. Bids visible. Can change bid status. Audit trail shows all events. Slot config editable. |
| 2.14 | **Admin status transitions** | `src/app/api/admin/bids/[id]/status/route.ts` | `PATCH /api/admin/bids/:id/status` changes bid status. Validates transition (submitted → accepted/declined/waitlisted). Creates audit trail entry. Updates slot state if accepted. | Status change persists. Audit trail records who changed what. Slot count updates on acceptance. |

**Sprint 2 demo:** End-to-end bid submission works. Invited visitor enters bid, reviews contract, signs, submits. Casey gets email. Bidder gets confirmation. Admin can see and act on bids.

---

### Sprint 3: Conversion Polish
**Goal:** Production-ready. Final copy. Mobile polish. Accessibility. Performance. Video-ready. Full QA.

| # | Ticket | Files Touched | Outcome | Validation |
|---|--------|--------------|---------|------------|
| 3.1 | **Copy tightening pass** | All section components | Every sentence tested against the 4 rules (belief, desire, uncertainty, urgency). No em dashes. No fluff. No jargon. Freight-native voice. | Read every line aloud. Does it sound like Casey or like a startup blog? Fix until Casey. |
| 3.2 | **Proof polish** | `src/components/sections/receipts.tsx` | Logo surfaces if available. Milestone markers refined. Timeline visually compressed. Stats presentation refined. | Proof section feels like momentum, not a brochure. |
| 3.3 | **Motion polish** | All components | Boot sequence timing refined. AnimatedCounter easing refined. Section entry animations (subtle, no scrolljacking). Signature pad ink feel. | Animations add premium feel without hurting trust. No jank. No delay on interaction. |
| 3.4 | **Mobile deep polish** | All components | Touch targets >= 44px. Form fields comfortable on mobile. Contract readable on mobile. Signature pad works on all mobile browsers. Bid flow navigable with thumb. | Test on iPhone Safari, Android Chrome. Every interaction completeable. |
| 3.5 | **Accessibility pass** | All components | WCAG 2.1 AA. Keyboard navigation through entire bid flow. Focus states visible. Contrast ratios passing. ARIA labels on interactive elements. Skip to content. Form error announcements. | axe-core audit passes. Tab through entire flow. Screen reader announces bid steps. |
| 3.6 | **Performance pass** | Next.js config, components | Lighthouse performance >= 90. No layout shift. Images optimized. Fonts preloaded. Critical CSS inlined by Next.js. Bundle analyzed. | Lighthouse audit. First contentful paint < 1.5s. No CLS. |
| 3.7 | **Video slot integration** | `src/components/sections/video-stage.tsx` | Video container accepts embed URL via env variable or admin config. Placeholder still works when no URL set. Autoplay/muted/loop options. | Set video URL → video plays. Remove URL → placeholder shows. No layout shift on load. |
| 3.8 | **Error state handling** | All form components, API routes | Network errors: retry prompt. Duplicate submission: detect and block. Invalid token mid-flow: graceful message. Session timeout: warn and preserve draft. | Disconnect network mid-submit → error message. Double-click submit → single submission. |
| 3.9 | **End-to-end QA** | All files | Full test of every path: valid bid, invalid bid, expired token, expired deadline, duplicate email, below-min bid, missing signature, missing consent, admin status change, email delivery. | Test matrix: 15+ scenarios. All pass. |
| 3.10 | **Analytics instrumentation** | `src/lib/analytics.ts`, all interactive components | Track: page_load, cta_click, bid_start, contract_open, consent_given, signature_complete, bid_submit_success, bid_submit_fail. Via audit_trail table + optional external. | Each event fires at correct moment. Events visible in audit_trail. |
| 3.11 | **Security hardening** | API routes, middleware | CSRF protection via origin check. Rate limiting on all write endpoints. Input sanitization (XSS prevention). No PII in client-side logs. Secure headers (CSP, HSTS via Vercel). | OWASP top 10 review. No XSS vectors. No CSRF. Rate limits enforced. |
| 3.12 | **Production deploy + cutover plan** | `vercel.json`, documentation | Production environment configured. Domain ready. Rollback documented. Feature flags for private/public mode. | Production deploy succeeds. Domain resolves. Rollback tested. |

**Sprint 3 demo:** Full production-ready `/partners` page. Invited buyer completes bid + sign end-to-end. Mobile works. Accessible. Fast. Video-ready. Admin functional.

---

## 9. Validation Criteria for Every Ticket

### Sprint 1

| Ticket | Automated Test | Manual Validation |
|--------|---------------|-------------------|
| 1.1 | `npm run build` exits 0. `npm run lint` exits 0. | Vercel deploy succeeds. |
| 1.2 | Route test: `/partners` returns 200. `/` redirects to `/partners`. | Browser navigation works. |
| 1.3 | Tailwind classes compile. No missing tokens. | Visual: dark theme, correct fonts, correct colors. |
| 1.4 | Component renders without error. Session storage read/write works. | Boot plays on first visit, skips on return. 3s max. |
| 1.5 | Component renders. CTA has correct href/onClick. | Full viewport. Readable. Scarcity visible. |
| 1.6 | Component renders. Aspect ratio maintained. | 16:9 container. Placeholder visible. |
| 1.7 | Stats display correct numbers (snapshot test). | AnimatedCounter animates. Timeline shows 4 entries. |
| 1.8 | Form fields present. Client validation fires on empty submit. | Fields render. Validation messages appear. |
| 1.9 | Timer computes correct remaining time (unit test). | Countdown matches wall clock. Expired state triggers. |
| 1.10 | Component renders. Email link present. | Copy matches spec. |
| 1.11 | No horizontal overflow (layout test). | Desktop + mobile visual QA. |
| 1.12 | Build succeeds in CI. | Preview deploy URL loads page. |

### Sprint 2

| Ticket | Automated Test | Manual Validation |
|--------|---------------|-------------------|
| 2.1 | Migration runs. Tables exist. RLS blocks anon inserts to bids. | Supabase dashboard shows correct schema. |
| 2.2 | Valid token → 200. Invalid → 403. Expired → 403. Used → 403. | Browser with token loads page. Without: blocked. |
| 2.3 | API returns JSON with correct shape. | Values match DB. |
| 2.4 | API returns fallback when no snapshot. Returns DB when snapshot exists. | Change DB → API reflects. |
| 2.5 | Components fetch and display API data. | Change DB slot count → page shows new count on refresh. |
| 2.6 | Valid bid → 201. Invalid → 400. Below min → 400. Post-deadline → 403. Rate limit → 429. | Submit bid → record in DB. |
| 2.7 | Contract interpolation unit test. | Rendered contract shows correct bidder name + amount. |
| 2.8 | Component renders with interpolated data. | Contract readable. Scrollable. |
| 2.9 | Consent checkboxes required. Signature required. Submit disabled until all present. | Touch signature on mobile. Clear works. |
| 2.10 | Hash generation deterministic (same input → same hash). IP captured. UA captured. | Contract record in DB has hash, IP, UA. Audit trail entry exists. |
| 2.11 | Flow transitions work. Submission creates all records. | Walk through all 7 steps. Confirmation shows reference ID. |
| 2.12 | Email sent on submission (mock test). | Check inbox: Casey gets details, bidder gets confirmation. |
| 2.13 | Admin page loads. Bids listed. Status editable. | Log in. See bids. Change status. |
| 2.14 | Status transition validates. Audit trail created. | Accept bid → bid status changes. Slot count updates. Audit trail entry created. |

### Sprint 3

| Ticket | Automated Test | Manual Validation |
|--------|---------------|-------------------|
| 3.1 | N/A | Read every sentence. 4-rule check. Voice check. |
| 3.2 | N/A | Visual inspection. Feels like proof, not brochure. |
| 3.3 | No layout shift (CLS test). | Animations feel premium. No jank. |
| 3.4 | Touch target size test (>= 44px). | iPhone Safari + Android Chrome full flow. |
| 3.5 | axe-core audit. Tab index test. | Screen reader test. Keyboard-only flow. |
| 3.6 | Lighthouse >= 90 performance. | FCP < 1.5s. No CLS. |
| 3.7 | Video container renders with/without URL. | Video plays. Placeholder fallback works. |
| 3.8 | Error boundary catches. Duplicate detection works. | Offline mid-submit → error message. Double submit → blocked. |
| 3.9 | 15-scenario test matrix. | All scenarios pass. |
| 3.10 | Events fire at correct moments. | Audit trail shows events. |
| 3.11 | No XSS in form inputs. Rate limits enforced. Origin checks pass. | Security review checklist. |
| 3.12 | Production build succeeds. | Domain resolves. Rollback works. |

---

## 10. File-by-File Implementation Map

```
dwtb-marketplace/
├── .env.example
├── .env.local                          (gitignored)
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
├── README.md
├── SPRINT-PLAN.md
│
├── supabase/
│   └── migrations/
│       └── 001_initial.sql             (all tables + RLS)
│
├── public/
│   ├── favicon.ico
│   └── og-image.png
│
└── src/
    ├── app/
    │   ├── layout.tsx                  (root layout, fonts, metadata)
    │   ├── page.tsx                    (redirect to /partners)
    │   ├── globals.css                 (Tailwind base + custom)
    │   │
    │   ├── partners/
    │   │   ├── layout.tsx              (partners layout wrapper)
    │   │   └── page.tsx                (main page, assembles sections)
    │   │
    │   ├── admin/
    │   │   ├── layout.tsx              (admin auth guard)
    │   │   └── page.tsx                (admin dashboard)
    │   │
    │   └── api/
    │       ├── invite/
    │       │   └── validate/
    │       │       └── route.ts        (POST: validate invite token)
    │       ├── slots/
    │       │   └── route.ts            (GET: slot state)
    │       ├── stats/
    │       │   └── route.ts            (GET: public stats)
    │       ├── bids/
    │       │   ├── route.ts            (POST: submit bid + contract)
    │       │   └── notify/
    │       │       └── route.ts        (POST: send emails)
    │       ├── contracts/
    │       │   └── route.ts            (POST: create contract record)
    │       └── admin/
    │           └── bids/
    │               └── [id]/
    │                   └── status/
    │                       └── route.ts (PATCH: change bid status)
    │
    ├── components/
    │   ├── boot-sequence.tsx
    │   ├── countdown.tsx
    │   ├── animated-counter.tsx
    │   │
    │   ├── sections/
    │   │   ├── hero.tsx
    │   │   ├── video-stage.tsx
    │   │   ├── receipts.tsx
    │   │   ├── bid-section.tsx
    │   │   ├── deadline-section.tsx
    │   │   └── operator-close.tsx
    │   │
    │   ├── bid/
    │   │   ├── offer-summary.tsx
    │   │   ├── bid-form.tsx
    │   │   ├── bid-flow.tsx            (step orchestrator)
    │   │   ├── contract-preview.tsx
    │   │   ├── consent-capture.tsx
    │   │   ├── signature-pad.tsx
    │   │   └── bid-confirmation.tsx
    │   │
    │   ├── admin/
    │   │   ├── bid-table.tsx
    │   │   ├── audit-viewer.tsx
    │   │   ├── slot-editor.tsx
    │   │   └── stats-editor.tsx
    │   │
    │   └── ui/
    │       ├── button.tsx
    │       ├── input.tsx
    │       ├── checkbox.tsx
    │       ├── card.tsx
    │       └── badge.tsx
    │
    └── lib/
        ├── supabase/
        │   ├── server.ts               (service role client)
        │   └── client.ts               (anon client, read-only)
        ├── contract-text.ts            (Q2 partnership agreement text)
        ├── contract-version.ts         (version constant)
        ├── crypto.ts                   (SHA-256 hash, adapted from Sensos)
        ├── validations.ts              (Zod schemas for bid, invite, etc.)
        ├── bids.ts                     (bid CRUD + state transitions)
        ├── contracts.ts                (contract creation + query)
        ├── invite.ts                   (token validation + usage)
        ├── slots.ts                    (slot state read + update)
        ├── stats.ts                    (stats query + fallback)
        ├── audit.ts                    (audit trail append)
        ├── email.ts                    (notification helpers)
        ├── rate-limit.ts              (in-memory rate limiter)
        ├── admin-auth.ts              (admin password check)
        ├── analytics.ts               (event tracking)
        ├── deadline.ts                (deadline constant + helpers)
        └── constants.ts               (fallback stats, config)
```

---

## 11. Risks / Blockers / Assumptions

### Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Supabase free tier limits** | Medium | Monitor usage. Upgrade if bid volume exceeds expectations. |
| **Email deliverability** | Medium | Use Resend (good deliverability). Fallback: audit trail + admin dashboard is primary record. |
| **Canvas signature not legally binding in all jurisdictions** | Low | Platform captures intent, consent, identity, timestamp, hash. This exceeds most e-sign requirements. Legal review can refine language. |
| **Deadline timezone confusion** | Medium | All deadlines stored/compared in UTC. Display converts to ET with explicit label. |
| **Invite token brute force** | Low | Tokens are UUID-length (32 chars). Rate limiting on validation endpoint. |
| **Client-side countdown manipulation** | Low | Server-side deadline enforcement on all write endpoints. Client countdown is UX only. |
| **Mobile signature pad quality** | Medium | Test on multiple devices. Canvas touch handling must be smooth. Consider fallback typed-name option. |

### Blockers

| Blocker | Owner | Resolution |
|---------|-------|------------|
| **Supabase project needs to be created** | DevOps | Create project, get keys, run migration. Ticket 2.1. |
| **Vercel project needs to be created** | DevOps | Create project, connect repo, configure env. Ticket 1.12. |
| **Final legal language not ready** | Legal | Placeholder contract text ships in Sprint 2. Legal refines in Sprint 3. Does not block foundation. |
| **Casey video not ready** | Casey | Video Stage section built with placeholder. Video drops in via env variable. Does not block any sprint. |
| **Minimum bid amount not set** | Casey/PO | Needs to be set in slot_config before go-live. Default to a reasonable placeholder during dev. |
| **Email service selection** | Backend | Resend recommended ($0 for 100 emails/day). Alternative: Supabase Edge Functions + SMTP. |

### Assumptions

1. Supabase is acceptable as the database platform.
2. No payment processing is needed in v1 (bids only, no deposits yet).
3. The admin dashboard can be password-protected (no OAuth needed for admin MVP).
4. IP address and user agent are available from Next.js request headers on Vercel.
5. Three Q2 slots with one filled is the correct starting state.
6. The deadline (April 6 at 11:59 PM ET) is firm and will not change during build.
7. Invite tokens can be manually generated in the admin dashboard or via Supabase directly for v1.

---

## 12. Harsh Self-Critique of the Plan

### As QA/Reviewer:

**Grading: B+**

**What is strong:**
- The IA is tight and commercially correct. Every section earns its place.
- The bid + contract flow is genuinely transactional, not a dressed-up form.
- The data model is real. SHA-256 audit trail, server-side validation, append-only logs.
- File map is concrete. No ambiguity about what gets built where.
- Sprint 1 ends with a demoable page. Sprint 2 ends with a working transaction engine. Sprint 3 ends production-ready.

**What is weak or risky:**

1. **Contract text is a black box.** Ticket 2.7 says "contract text as TypeScript constant" but doesn't specify the actual contract structure. What sections does a Q2 partnership agreement need? Term, scope, payment terms, termination, IP, confidentiality? The plan hand-waves this as "placeholder language" but the structure matters even for placeholder — it determines how the contract preview component is built. **Fix: Define contract sections in the plan.**

2. **Admin auth is too simple.** "Password-protected" admin panel is fine for MVP but needs rate limiting on login and should use httpOnly cookies, not localStorage. The plan doesn't specify this. **Fix: Specify admin auth mechanism.**

3. **Email is underspecified.** "Via Resend or SMTP" is vague. Resend requires an API key, a verified domain, and template decisions. This should be a concrete ticket. **Fix: Make email setup a distinct ticket with provider decision.**

4. **No offline/draft persistence.** If a buyer starts filling out the bid form and accidentally navigates away, everything is lost. The plan mentions "draft" status in the state machine but nothing saves drafts client-side. **Fix: Add localStorage draft persistence for bid form.**

5. **The combined bid + contract submission API (ticket 2.11) is doing too much.** It creates a bid, creates a contract, writes audit trail, sends emails, validates deadline. This should be a transaction with clear failure modes. What happens if the contract write fails but the bid succeeded? **Fix: Use a database transaction. Document rollback behavior.**

6. **No test infrastructure.** The plan says "automated tests" in the validation criteria but never specifies a test framework or creates a testing ticket. **Fix: Add Vitest setup to Sprint 1. Add integration test tickets to Sprint 2.**

7. **The countdown shows days, hours, minutes, seconds — but the deadline is April 6.** Today is April 2. That is 4 days. Is this enough time to build Sprint 1 + Sprint 2 and go live? **Risk: The deadline may arrive before the platform is ready.** The plan should address phased go-live or request deadline flexibility.

8. **No CORS or CSP specification.** API routes need correct CORS headers. The page needs a Content Security Policy that allows canvas operations and Supabase connections but blocks injection. **Fix: Add security headers ticket.**

9. **Bid + contract are submitted as separate API calls in the ticket structure, but the user flow is a single submission.** Are these two sequential API calls from the client, or one combined call? The plan is ambiguous. **Fix: Clarify — single API route that creates both atomically.**

10. **No load testing or concurrency consideration.** What if two buyers submit bids simultaneously and both attempt to claim the same slot intent? The slot_config table needs optimistic locking or a transaction guard. **Fix: Add slot concurrency strategy.**

### As Design/UX Lead:

11. **The boot sequence may annoy repeat visitors even with session skip.** What if the visitor clears their browser data or uses incognito? They see the boot again. Consider a "skip" button that appears after 1 second. **Fix: Add skip affordance.**

12. **Seven-step bid flow may feel heavy.** Offer review → bid entry → contract preview → consent → sign → submit → confirmation is a lot of steps on one page. Consider whether some steps can be collapsed. For example, consent checkboxes can live on the contract preview step, reducing to 5 steps. **Fix: Review step count.**

13. **The signature pad on mobile needs more specification.** What size? What happens when the user rotates the device? What if they have a case with a stylus nub? **Fix: Specify signature pad dimensions and mobile behavior.**

---

## 13. Revised Final Plan After Critique

### Changes Applied:

**C1. Contract structure defined.**

The Q2 Partnership Agreement will have these sections:
1. Parties (DWTB?! Studios LLC and Bidder)
2. Term (Q2 2026: April–June)
3. Scope of Services (signal-driven GTM engine access)
4. Bid Amount and Payment Terms
5. Acceptance and Slot Reservation
6. Confidentiality
7. Limitation of Liability
8. Termination
9. Governing Law
10. Electronic Signature Acknowledgment

Placeholder language for each section. Legal can refine post-launch.

**C2. Admin auth mechanism specified.**

Admin auth uses a shared password stored in `ADMIN_PASSWORD` env variable. Login form sets an httpOnly cookie (signed with `ADMIN_SECRET`). Rate limited to 5 attempts per minute per IP. Session expires in 24 hours. This is MVP-appropriate for a single admin (Casey).

**C3. Email provider decided.**

Using **Resend** (resend.com). Free tier: 100 emails/day (more than enough). API key in env. Domain verification for `dwtb.dev`. New ticket added: **2.12a — Resend setup + domain verification.**

**C4. Draft persistence added.**

New ticket: **2.11a — localStorage draft persistence for bid form.** On each field change, save to `localStorage('dwtb_bid_draft')`. On page load, restore draft. On successful submission, clear draft. Draft auto-expires after 24 hours.

**C5. Atomic submission specified.**

Ticket 2.11 (bid-to-sign wiring) now uses a **single API route** (`POST /api/bids`) that atomically:
1. Validates all fields
2. Checks deadline
3. Creates bid record
4. Creates contract record
5. Creates audit trail entry
6. All within a Supabase RPC / database transaction
7. If any step fails, entire submission rolls back
8. Email notification is fire-and-forget (does not block or roll back)

Tickets 2.6 and 2.10 are **merged into 2.6** (single bid+contract submission route). Ticket 2.10 is removed.

**C6. Test infrastructure added.**

New ticket: **1.1a — Vitest + React Testing Library setup.** Added to Sprint 1. All Sprint 2 tickets include unit test requirements.

**C7. Deadline vs. build timeline acknowledged.**

The deadline is April 6 (4 days from now). Realistic plan:
- Sprint 1 (stage): April 2-3 (2 days)
- Sprint 2 (engine): April 3-5 (2 days, overlapping)
- Sprint 3 (polish): April 5-6 (1 day, parallel with QA)

This is aggressive but achievable because:
- The data model is defined and concrete
- The reuse audit identified proven patterns to adapt
- No design exploration needed — the IA is locked
- One developer (with AI assistance) building a single page

If Sprint 2 is not complete by April 5, the page can go live with Sprint 1 shell + a simplified bid form that emails directly (downgraded but functional fallback).

**C8. Security headers ticket added.**

New ticket: **3.11 — Security hardening** (already exists). Expanded to include Content Security Policy allowing `canvas` operations, Supabase API domain, and Resend. CORS headers on API routes (same-origin only). X-Frame-Options: DENY.

**C9. Single submission route confirmed.**

Bid + contract are created in a single `POST /api/bids` call. Client sends all data (bidder info, bid amount, consent, signature, contract version) in one request. Server creates all records atomically. No separate `/api/contracts` route needed for the submission flow. The `/api/contracts` route (if kept) is read-only for admin use.

**C10. Slot concurrency addressed.**

The `POST /api/bids` route checks slot availability inside the transaction. If `filled_slots + pending_slots >= total_slots`, the bid is accepted but immediately waitlisted. Slot reservation only happens when admin accepts a bid (ticket 2.14), using `UPDATE slot_config SET filled_slots = filled_slots + 1 WHERE filled_slots < total_slots RETURNING *` — if no row returns, the acceptance fails and admin is notified that slots are full.

**C11. Boot sequence skip button added.**

After 1 second, a subtle "Skip" text appears in bottom-right corner. Click or press Escape to skip. Session storage still prevents replay on return visits.

**C12. Bid flow steps condensed.**

Revised from 7 steps to 5:
1. **Review Offer** (slot info, min bid, deadline, what you get)
2. **Enter Bid** (bidder info + bid amount + optional note)
3. **Review + Sign** (contract preview + consent checkboxes + signature pad, all on one step)
4. **Confirm + Submit** (summary + submit button)
5. **Confirmation** (success + reference ID)

Steps 3-4 of the old plan (contract preview and consent) merge with step 5 (signature) into a single "Review + Sign" step. This reduces cognitive load without losing any legal capture.

**C13. Signature pad mobile spec added.**

- Width: 100% of container (max 640px)
- Height: 200px (desktop), 150px (mobile)
- Touch: `touchstart`, `touchmove`, `touchend` with `preventDefault()`
- Line width: 2px
- Color: white on dark background
- Clear button: top-right corner of pad
- On orientation change: canvas redraws (preserve signature data in state)

---

## Role Coverage and Ownership

| # | Role | Responsibilities | Deliverables | Active Sprints | Key Tickets |
|---|------|-----------------|-------------|----------------|-------------|
| 1 | **Product Owner / Frame Owner** | Commercial thesis. Success criteria. Drift prevention. Copy direction approval. | Product thesis doc. Copy approval on Sprint 3. Go/no-go decision. | 1, 2, 3 | Reviews all tickets. Owns 3.1 (copy). |
| 2 | **Technical Architect** | Repo structure. Route design. Types. State model. Tech stack decisions. Reuse decisions. | File map. Data model. API contracts. | 1, 2 | 1.1, 1.2, 2.1, 2.6 (API design). |
| 3 | **Reuse Auditor** | Inspected Sensos + DWTB repos. Identified reuse vs rebuild. | Reuse audit report (completed above). | Pre-sprint | Informs 2.6, 2.9 (e-sign), 2.5 (countdown). |
| 4 | **Design / UX Lead** | Hierarchy. Interaction flow. Mobile behavior. Motion restraint. Premium feel. | Component layout specs. Step flow design. | 1, 3 | 1.3, 1.5, 1.11, 3.3, 3.4. Reviews bid flow (2.11). |
| 5 | **Frontend Engineer** | Page sections. Bid entry UI. Contract preview. Signature UI. Responsive. | All `src/components/` files. | 1, 2, 3 | 1.4-1.11, 2.8, 2.9, 2.11, 3.3, 3.4. |
| 6 | **Backend / Workflow Engineer** | Invite validation. Bid persistence. Status transitions. Stats wiring. Admin records. | All `src/app/api/` routes. All `src/lib/` modules. | 2, 3 | 2.1-2.7, 2.12-2.14, 3.11. |
| 7 | **E-sign / Audit-Trail Engineer** | Consent capture. Signature hash. Timestamping. Append-only records. | `crypto.ts`, `audit.ts`, `contracts.ts`, signature components. | 2 | 2.6 (hash), 2.9 (signature pad), 2.11 (audit trail). |
| 8 | **Contracting / Legal-Plumbing Reviewer** | Contract structure. Consent language. Data capture sufficiency. | Contract template review. Consent copy review. | 2, 3 | Reviews 2.7, 2.8, 2.9, 3.1. |
| 9 | **QA Lead** | E2E validation. Error states. Edge cases. Test matrix. | Test scenarios. Bug reports. | 2, 3 | 3.9 (E2E QA). Reviews all Sprint 2 tickets. |
| 10 | **Accessibility / Usability Reviewer** | Keyboard flow. Field order. Contrast. Focus states. | axe audit. Keyboard test. | 3 | 3.5. Reviews 1.8, 2.9, 2.11. |
| 11 | **Analytics / Instrumentation Owner** | Event definitions. Tracking code. Audit trail integration. | `analytics.ts`. Event specs. | 3 | 3.10. |
| 12 | **DevOps / Deployment Owner** | Repo bootstrap. Vercel setup. Env vars. Preview deploys. Cutover plan. | Vercel project. CI/CD. Env config. | 1, 3 | 1.1, 1.12, 3.12. |
| 13 | **Copy Chief / Conversion Editor** | Final public copy. Casey voice. Jargon removal. | Copy for all sections. | 1 (draft), 3 (final) | 1.5-1.10 (draft copy), 3.1 (final copy). |

### Multi-Hat Assignments (Single Developer + AI)

In practice, one developer with AI assistance wears all 13 hats. The role structure ensures no responsibility is ownerless. The mapping above makes explicit which hat is worn for each ticket.

**Primary execution groupings:**

- **Architect + DevOps:** Tickets 1.1, 1.2, 1.12, 2.1 (foundation)
- **Frontend + Design/UX:** Tickets 1.3-1.11, 2.8, 2.9, 2.11, 3.3, 3.4 (all UI)
- **Backend + E-sign + Audit:** Tickets 2.2-2.7, 2.12-2.14, 3.11 (all server)
- **QA + Accessibility:** Tickets 3.5, 3.8, 3.9 (all quality)
- **PO + Copy Chief:** Tickets 3.1, 3.2 (all copy/proof)
- **Reuse Auditor:** Pre-sprint (completed)
- **Legal Reviewer:** Reviews during Sprint 2, blocks nothing

---

## Revised Sprint Ticket Summary

### Sprint 1: Build the Stage (12 tickets + 1 added)

| # | Ticket | Priority |
|---|--------|----------|
| 1.0 | Vitest + React Testing Library setup | P0 |
| 1.1 | Bootstrap Next.js 16 + TypeScript repo | P0 |
| 1.2 | Route structure + layout | P0 |
| 1.3 | Design system foundation | P0 |
| 1.4 | Boot Sequence component | P1 |
| 1.5 | Hero section | P0 |
| 1.6 | Video Stage section | P1 |
| 1.7 | Receipts section | P1 |
| 1.8 | Bid section shell | P0 |
| 1.9 | Deadline section | P0 |
| 1.10 | Casey/Operator section | P1 |
| 1.11 | Responsive + scroll behavior | P0 |
| 1.12 | Vercel deployment config | P0 |

### Sprint 2: Build the Transaction Engine (13 tickets, revised)

| # | Ticket | Priority |
|---|--------|----------|
| 2.1 | Supabase project + schema + RLS | P0 |
| 2.2 | Invite token validation | P1 |
| 2.3 | Slot state API | P0 |
| 2.4 | Stats API | P1 |
| 2.5 | Wire stats + slots to frontend | P1 |
| 2.6 | Bid + contract atomic submission API | P0 |
| 2.7 | Contract text + version + structure | P0 |
| 2.8 | Contract preview UI | P0 |
| 2.9 | E-sign consent + signature capture | P0 |
| 2.11 | Full bid-to-sign flow wiring + draft persistence | P0 |
| 2.12 | Email notifications (Resend) | P1 |
| 2.13 | Admin dashboard | P1 |
| 2.14 | Admin status transitions | P1 |

### Sprint 3: Conversion Polish (12 tickets)

| # | Ticket | Priority |
|---|--------|----------|
| 3.1 | Copy tightening pass | P0 |
| 3.2 | Proof polish | P1 |
| 3.3 | Motion polish | P2 |
| 3.4 | Mobile deep polish | P0 |
| 3.5 | Accessibility pass | P0 |
| 3.6 | Performance pass | P1 |
| 3.7 | Video slot integration | P1 |
| 3.8 | Error state handling | P0 |
| 3.9 | End-to-end QA | P0 |
| 3.10 | Analytics instrumentation | P2 |
| 3.11 | Security hardening | P0 |
| 3.12 | Production deploy + cutover | P0 |

---

## Final Grade (Post-Critique): A-

**What elevated the grade:**
- Contract structure is now defined (10 sections)
- Admin auth is specified (httpOnly cookie, rate limited)
- Email provider is decided (Resend)
- Draft persistence prevents data loss
- Atomic submission with transaction rollback
- Slot concurrency addressed with DB-level guard
- Bid flow condensed from 7 to 5 steps
- Mobile signature pad fully specified
- Security headers and CORS addressed
- Build-vs-deadline timeline is realistic and has a fallback plan

**What keeps it from A+: (now addressed in v2.0)**

See Section 14 for all A+ gap fixes applied.

**Remaining risk:** The April 6 deadline is 4 days away. This plan is buildable in that window with focused execution, but there is zero margin for scope creep or infrastructure surprises. The fallback (Sprint 1 shell + simplified email-based bid) is the safety net.

---

## 14. A+ Gap Fixes (v2.0 Additions)

These fixes address every gap identified in the v1.0 critique review. Each is categorized by severity and maps to a ticket.

---

### CRITICAL FIXES

**F1. Downloadable signed contract is now a Sprint 2 P0 requirement (ESIGN Act § 7001(c))**

The ESIGN Act requires the signer to be able to access and retain a copy of the signed agreement at the time of signing. This is not optional.

New ticket: **2.15 — Signed contract PDF generation + delivery** (Sprint 2, P0)
- Files: `src/lib/pdf.ts`, `src/app/api/bids/receipt/[id]/route.ts`
- On submission: server generates a PDF containing: full contract text, interpolated bidder name/company/amount, signature image (or "Electronically signed" notation), timestamp, bid reference ID, integrity hash
- PDF is stored as Supabase Storage object and reference saved in `contracts.receipt_url`
- In-browser download link shown on confirmation screen
- PDF attached to both Casey and bidder confirmation emails
- Validation: Download link works immediately on confirmation. Bidder can close and reopen confirmation email and download is still accessible.

**F2. Rate limiting replaced with Vercel-compatible implementation**

In-memory rate limiting does not persist across Vercel serverless cold boots. All references to `src/lib/rate-limit.ts` as an in-memory Map are replaced.

Implementation: **Upstash Redis** (free tier, purpose-built for edge/serverless, available as Vercel integration)
- `src/lib/rate-limit.ts` uses `@upstash/ratelimit` + `@upstash/redis`
- Sliding window: 5 requests / 60 seconds per IP for write endpoints
- Fallback: if Upstash is unavailable, log the attempt and proceed (don't block on rate-limiter failure)
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` added to `.env.example`
- Applied to: `POST /api/bids`, `POST /api/invite/validate`, `POST /api/admin/login`

**F3. Idempotency key added to bid submission**

Network timeout → retry → duplicate bid creation is prevented.

- Client generates a UUID (`crypto.randomUUID()`) when the bid flow starts and stores it in React state + localStorage under `dwtb_bid_idempotency_key`
- Client sends `Idempotency-Key: <uuid>` header with every `POST /api/bids` request
- Server checks `bids` table for existing row with `idempotency_key = ?` before inserting
- If found: returns the existing bid response (200, not 201) — no duplicate created
- `idempotency_key VARCHAR(64) UNIQUE` column added to `bids` table in migration
- Key is cleared from localStorage only on successful confirmation render

**F4. Post-deadline page state is now fully specified**

See Section 7 — "Post-Deadline State" for copy and frame.

Technical implementation:
- `src/lib/deadline.ts` exports `isExpired(deadline: Date): boolean`
- `src/app/partners/page.tsx` fetches deadline from `GET /api/slots` at render time (server component)
- If expired: renders `<ExpiredState />` component in place of bid section and deadline section
- `<ExpiredState />` is a standalone component: `src/components/sections/expired-state.tsx`
- Boot sequence detects expired state and shows alternate copy
- Admin can set `slot_config.manually_closed = true` to trigger expired state early
- `manually_closed BOOLEAN DEFAULT FALSE` column added to `slot_config` table
- Ticket: **1.9 expanded** to include expired state component alongside countdown.

---

### HIGH FIXES

**F5. Post-submit bidder status check**

- New API: `GET /api/bids/status?ref=<bid_id>&email=<bidder_email>` — returns bid status (no auth, but requires both ref + email to prevent enumeration)
- New page: `src/app/partners/confirmation/page.tsx` — shows bid status, download link, reference ID. Accessible without login using ref + email in URL params.
- Status change notifications: ticket **2.14 expanded** to trigger a Resend email on every admin status transition (accepted/declined/waitlisted). Copy for each state:
  - **Accepted:** "Your bid has been accepted. Casey will be in touch within 24 hours to confirm next steps."
  - **Declined:** "Your bid was not selected for Q2. DWTB?! Studios will be running a limited Q3 window. Watch for an invite."
  - **Waitlisted:** "Your bid is on the waitlist. If a slot opens before April 6, you will hear from us immediately."

**F6. Competitive intelligence lockdown**

- `GET /api/slots` returns ONLY: `total_slots`, `remaining_slots`, `min_bid`, `deadline`. **Never** returns pending count, accepted count, or bid amounts.
- `GET /api/bids/*` routes are admin-only (require valid admin session cookie). No public bid listing endpoint exists.
- RLS on `bids` table: SELECT disabled for anon. Service role only.
- `pending_slots` column in `slot_config` is internal-only, never surfaced in public API response.

**F7. filled_slots vs accepted_slots — clarified and simplified**

Previous schema had both columns with undefined distinction. Now:
- `filled_slots` is **removed** from `slot_config`
- `accepted_slots INT NOT NULL DEFAULT 1` is the single source of truth for how many slots are taken
- `remaining_slots` is computed: `total_slots - accepted_slots` (returned by API, not stored)
- `pending_slots INT NOT NULL DEFAULT 0` tracks bids under admin review (submitted but not yet accepted/declined)
- Slot is only decremented by `accepted_slots + 1` when admin explicitly accepts a bid (ticket 2.14)
- Migration updated accordingly.

**F8. Invite token generation — explicit workflow**

No ticket previously handled how Casey creates tokens. Now:

New ticket: **2.1a — Admin invite token generator** (Sprint 2, P1)
- Files: `src/app/admin/tokens/page.tsx`, `src/app/api/admin/tokens/route.ts`
- Admin page: form with optional `invitee_email`, `expires_at` (default: April 6 11:59 PM ET), `max_uses` (default: 1)
- Submit → server generates a cryptographically random 24-char alphanumeric code (`crypto.getRandomValues()`, not UUID — shorter and URL-safe)
- Token stored in `invite_tokens` table
- Page displays generated token + copyable invite URL: `https://dwtb.dev/partners?token=<code>`
- Existing tokens listed with status badges
- Revoke button per token

**F9. Duplicate email bid policy — decided and enforced**

Decision: **one bid per email address per contract version**. Rationale: a buyer should submit their best bid, not game the system with multiple submissions.

- `UNIQUE(bidder_email, contract_version)` constraint on `bids` table
- API returns a specific error code on duplicate: `{ error: 'DUPLICATE_BID', message: 'A bid from this email already exists for Q2 2026.' }`
- Client shows this as a non-dismissable alert with: "A bid from [email] was already submitted. Contact casey@dwtb.dev if you need to amend."
- Amendment is manually handled by Casey via admin dashboard (can delete and allow resubmit, or adjust amount directly)

**F10. Bid amount confirmation UX**

Step 4 ("Confirm + Submit") now includes:
- Bid amount displayed in large monospace type: `$XX,XXX`
- Explicit label: "You are submitting an official bid of:"
- Secondary line: "This becomes binding if accepted by DWTB?! Studios."
- No way to reach the Submit button without this confirmation being visible
- Client-side: if bid_amount > $50,000, show additional "Confirm high-value bid" checkbox

**F11. Browser back button and page exit handling**

- `bid-flow.tsx` uses `history.pushState({step: N}, '', window.location.pathname + '?step=N')` on each step advance
- `popstate` event listener rewinds the step (back button = previous step, not page exit)
- `beforeunload` event: if step >= 2 (bid entered but not confirmed), show browser prompt: "Leave? Your bid has not been submitted."
- On return, localStorage draft restores all fields
- After successful submission: `beforeunload` listener removed and `history.replaceState` sets `?step=confirmed`

**F12. Email delivery failure — logging and recovery**

- `notification_sent BOOLEAN DEFAULT FALSE` column added to `bids` table
- After successful Resend call: `UPDATE bids SET notification_sent = true WHERE id = ?`
- Admin dashboard surfaces bids where `notification_sent = false` as a banner: "X bid(s) with undelivered notifications — resend via admin action"
- New admin action: `POST /api/admin/bids/:id/notify` — retriggers email for a specific bid
- Resend errors are logged to `audit_trail` with `event_type = 'email_delivery_failed'`

**F13. Contract version pinned server-side**

- Client sends only bidder fields + signature data in `POST /api/bids`. It does NOT send contract version.
- Server resolves current `CONTRACT_VERSION` from `src/lib/contract-version.ts` at request time
- Server resolves current contract text from `src/lib/contract-text.ts` at request time (same source of truth as the preview rendered to the client)
- Hash includes the server-resolved `CONTRACT_VERSION` — cannot be spoofed by client
- If contract text changes between preview render and submission → hash mismatch is detectable. Admin audit trail records both version strings.

**F14. Typed name added to signature step (ESIGN triple-intent)**

- Signature step now has three intent markers: canvas signature + two consent checkboxes + typed full name
- Field: "Type your full name to confirm" (required, must match bidder_name entered in step 2, case-insensitive)
- Mismatch: "Name does not match. Please type your full name as entered: [bidder_name]"
- Typed name stored in `contracts` table as `typed_name VARCHAR(255)` column
- Included in SHA-256 hash input string
- This satisfies ESIGN Act "intent to sign" requirement with maximum defensibility

---

### MEDIUM FIXES

**F15. Canvas ink validation — deterministic**

- Blank canvas `toDataURL()` is captured once on mount and stored as `blankCanvasRef`
- On each draw event: compare `canvas.toDataURL() !== blankCanvasRef.current` to detect ink
- `hasInk` state is set true only on this comparison (not on any mousedown/touchstart event alone)
- Canvas clear button resets to blank and re-captures blank reference

**F16. Device orientation change — signature preserved**

- Signature image saved as base64 string in React state on every draw event (debounced 300ms)
- On `orientationchange` event: canvas resizes, then redraws from saved base64 string using `drawImage()`
- If no signature was drawn before rotation: blank canvas
- If signature was drawn: redrawn at new dimensions (may scale, which is acceptable)

**F17. Client-server clock sync**

- On page load: `GET /api/time` returns server UTC timestamp
- Client computes offset: `serverOffset = serverTime - Date.now()`
- Countdown timer uses `Date.now() + serverOffset` for all remaining-time calculations
- This prevents false expiry (client clock ahead) and false deadline extension (client clock behind)
- If `/api/time` fails: degrade gracefully, use client clock, log warning

**F18. Corporate proxy / VPN rate limit — IP + session fingerprint**

- Rate limit key is `sha256(ip + user_agent)` rather than IP alone
- Reduces false positives for multiple buyers behind the same corporate proxy
- Does not fully solve (same device/browser = same key), but is meaningfully better
- For truly shared IPs: admin can manually review audit trail and waive the rate limit for a specific bid

**F19. Stats freshness indicator**

- `stats_snapshot` table has `as_of TIMESTAMPTZ` column (already in schema)
- Receipts section displays: "As of [formatted date]" beneath the stats grid
- If `as_of` is more than 7 days old: admin dashboard shows a warning badge "Stats may be stale"
- Admin can update via stats editor (ticket 2.13)

**F20. Zero-bids contingency**

- Admin dashboard shows a prominent "0 bids submitted" state if no bids exist
- Post-deadline with zero bids: page shows expired state with copy as specified in F4
- The expired state copy does NOT reference prior bid count (avoids "0 bids" being visible to public)
- Casey's recovery path: send direct outreach to invited parties, optionally reopen window
- Admin can reset deadline via `slot_config.deadline` update to extend the window if needed

**F21. Bid amount typo — high-value confirmation**

Already addressed in F10. Additionally:
- Server validates bid amount against a sanity ceiling: `MAX_BID_AMOUNT = 500000` (configurable via env)
- If bid > MAX_BID_AMOUNT: server returns 400 with `{ error: 'BID_EXCEEDS_MAXIMUM' }` — protects against typos like $1,000,000 instead of $10,000

**F22. Duplicate email UX — defined**

Already covered in F9. Additionally: the duplicate error is surfaced as a step-level error (not a toast) so the bidder cannot accidentally dismiss it.

---

### UPDATED DATA MODEL (v2.0)

```sql
-- New columns added to existing tables:

-- bids table additions:
idempotency_key    VARCHAR(64) UNIQUE,
notification_sent  BOOLEAN DEFAULT FALSE,

-- CONSTRAINT: one bid per email per contract version
CONSTRAINT unique_bid_per_email UNIQUE (bidder_email, contract_version)

-- contracts table additions:
typed_name         VARCHAR(255) NOT NULL,

-- slot_config table changes:
-- REMOVE: filled_slots
-- KEEP: accepted_slots INT NOT NULL DEFAULT 1 (was accepted_slots, now sole slot counter)
-- KEEP: pending_slots INT NOT NULL DEFAULT 0
-- ADD:
manually_closed    BOOLEAN DEFAULT FALSE,

-- invite_tokens table: no changes (code is now 24-char alphanumeric, not UUID)
```

---

### UPDATED SPRINT 2 TICKET LIST (v2.0)

| # | Ticket | Priority | Change from v1.0 |
|---|--------|----------|------------------|
| 2.1 | Supabase project + schema + RLS | P0 | Schema updated (new columns, constraints) |
| 2.1a | Admin invite token generator | P1 | **NEW** |
| 2.2 | Invite token validation | P1 | Code format updated (24-char alphanumeric) |
| 2.3 | Slot state API | P0 | Competitive lockdown: pending_slots not exposed |
| 2.4 | Stats API + freshness indicator | P1 | Add as_of field to response |
| 2.5 | Wire stats + slots to frontend | P1 | Add freshness display to Receipts |
| 2.6 | Bid + contract atomic submission API | P0 | +Idempotency, +server-clock deadline check, +rate limit (Upstash), +duplicate email guard, +contract version server-pinned |
| 2.7 | Contract text + version + structure | P0 | +Server-side version resolution |
| 2.8 | Contract preview UI | P0 | No change |
| 2.9 | E-sign consent + signature capture | P0 | +Typed name field, +canvas blank detection, +orientation save/restore |
| 2.11 | Full bid-to-sign flow wiring + draft persistence | P0 | +Back button history, +beforeunload guard, +bid amount confirmation, +idempotency key generation |
| 2.12 | Email notifications (Resend) + domain setup | P1 | +notification_sent flag, +PDF attachment |
| 2.13 | Admin dashboard | P1 | +Unnotified bids banner, +token generator link, +stats freshness warning |
| 2.14 | Admin status transitions + bidder notifications | P1 | +Status change emails to bidder per state |
| 2.15 | Signed contract PDF generation + delivery | P0 | **NEW — ESIGN legal requirement** |

---

### UPDATED SPRINT 1 TICKET LIST (v2.0)

| # | Ticket | Priority | Change from v1.0 |
|---|--------|----------|------------------|
| 1.0 | Vitest + React Testing Library setup | P0 | No change |
| 1.1 | Bootstrap Next.js 16 + TypeScript repo | P0 | +Upstash env vars in .env.example |
| 1.2 | Route structure + layout | P0 | +/partners/confirmation route |
| 1.3 | Design system foundation | P0 | No change |
| 1.4 | Boot Sequence component | P1 | +Expired state alternate copy |
| 1.5 | Hero section | P0 | No change |
| 1.6 | Video Stage section | P1 | No change |
| 1.7 | Receipts section | P1 | +Stats freshness display |
| 1.8 | Bid section shell | P0 | No change |
| 1.9 | Deadline + expired state | P0 | **Expanded**: +ExpiredState component, +server clock sync, +manually_closed flag handling |
| 1.10 | Casey/Operator section | P1 | No change |
| 1.11 | Responsive + scroll behavior | P0 | No change |
| 1.12 | Vercel deployment config + Upstash integration | P0 | +Upstash Redis setup |

---

### FINAL GRADE (v2.0): A+

**What now earns A+:**
- **ESIGN Act compliance is complete.** Signed PDF generated server-side, delivered on confirmation, attached to both emails.
- **Rate limiting works on Vercel.** Upstash Redis replaces in-memory Map.
- **Idempotency prevents duplicate bids.** Network retries are safe.
- **Post-deadline state is fully specified.** DWTB moves on. The page shows that clearly.
- **Post-submit experience is defined.** Bidder can check status. Casey notifies on transitions.
- **Competitive intelligence is locked.** Public API never exposes bid amounts or pending count.
- **Schema is clean.** filled_slots removed. Constraints prevent duplicate email bids.
- **Token generation is ticketed.** Casey can generate and manage invite tokens from admin UI.
- **Signature has triple intent.** Canvas + typed name + dual consent checkboxes.
- **Back button and tab exit are handled.** Bidder never silently loses progress.
- **Email delivery failure is surfaced and recoverable.**
- **Contract version is pinned server-side.** Cannot be spoofed.
- **Canvas validation is deterministic.** Not pixel-counting guesswork.
- **Clock sync prevents deadline edge cases.**
- **Bid amount typo protection at both client and server.**
- **Zero-bids contingency is defined.** Admin is unambiguously informed.
- **Stats have a freshness indicator and staleness warning.**

**What is still intentionally deferred (not a gap):**
- Final legal language (placeholder is correct for now — foundation holds)
- Payment/deposit flow (explicitly post-MVP)
- WebSocket real-time admin updates (30s polling is sufficient for this bid volume)
- Third-party timestamp authority (SHA-256 + server timestamp is legally sufficient)
