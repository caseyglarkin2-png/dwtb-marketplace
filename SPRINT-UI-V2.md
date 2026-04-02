# DWTB?! Studios — "THE SENSOS TREATMENT" UI Sprint

## A+ Rapid Visual & Conversion Upgrade — Execute Before Launch

### Panel-Reviewed. Dependency-Free. CSS-First. Ship in 2 Hours

---

## THE THESIS

The current page is mechanically sound — boot → hero → proof → bid → close is the right flow. But it looks like a "good Tailwind template." The gap between "good" and "holy shit, this person built THAT to sell their services" is:

1. **Texture** — one CSS property that kills flat-screen syndrome
2. **Ambient liveness** — the page should feel like a trading floor, not a brochure
3. **Typographic authority** — bigger, tighter, heavier where it counts
4. **Conversion always-on** — the buy button should never leave the viewport
5. **Commitment escalation** — capture email early, dim the world when they're in the deal room

**ZERO new dependencies. CSS + existing IntersectionObserver patterns only.**
**No framer-motion. No parallax. No CRT gimmicks. No ambient notification spam.**

---

## EXECUTION ORDER (CRITICAL PATH)

### PHASE 1: INSTANT PREMIUM — 15 Minutes

*CSS-only changes. Zero component logic. Maximum visual transformation.*

#### 1.1 — Film Grain Noise Overlay (5 min) — **P0**

**File:** `src/app/globals.css`
**What:** Add SVG noise texture as `::after` pseudo-element on `body`. `position: fixed`, `pointer-events: none`, `opacity: 0.03`, `mix-blend-mode: overlay`, `z-index: 100`.
**Why:** This single change transforms "Tailwind dark template" into "cinematic." It's the #1 highest-ROI visual upgrade in the entire plan.
**Risk:** None. Pure CSS. No layout impact.

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  opacity: 0.03;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}
```

#### 1.2 — CTA Accent Glow States (5 min) — **P0**

**File:** `src/app/globals.css`
**What:** Add hover glow to all accent-bg buttons: `hover:shadow-[0_0_30px_rgba(0,255,194,0.15)]`. Add `transition-shadow duration-300`. Apply to `.btn-accent` or via Tailwind utility classes directly on button elements.
**Files also:** Hero CTA, Deadline CTA, Bid submit buttons.
**Risk:** None. CSS transitions.

#### 1.3 — Card Glass Effect (5 min) — **P0**

**File:** `src/components/sections/receipts.tsx` (StatCard), `src/components/bid/bid-flow.tsx` (step cards)
**What:** Replace `bg-surface-raised border border-border` with `bg-surface-raised/80 backdrop-blur-sm border border-border/50`.
**Why:** Subtle glassmorphism. Modern. Premium. Zero layout change.
**Risk:** `backdrop-blur` has universal browser support. Safe.

---

### PHASE 2: TYPOGRAPHIC AUTHORITY — 10 Minutes

*Size up. Track tight. Add geometric punctuation.*

#### 2.1 — Section Header Power-Up (5 min) — **P1**

**Files:** `hero.tsx`, `receipts.tsx`, `bid-section.tsx`, `deadline-section.tsx`, `operator-close.tsx`
**What:**

- All section `<h2>` elements: bump from `text-3xl md:text-5xl` → `text-4xl md:text-6xl lg:text-7xl tracking-tight`
- Hero `<h1>`: already large, add `tracking-tight` (-0.025em)
- Hero subline: add `font-light tracking-wide` for editorial contrast

**Why:** Tighter tracking on large type = institutional authority. This is what separates Bloomberg from Squarespace.
**Risk:** None. Tailwind utility changes.

#### 2.2 — Accent Divider Lines (5 min) — **P1**

**File:** `src/app/partners/page.tsx`
**What:** Between each major section, add:

```tsx
<div className="w-16 h-px bg-accent/40 mx-auto" />
```

Place between: Hero↔Video, Video↔Receipts, Receipts↔Bid, Bid↔Deadline, Deadline↔Close.
**Why:** Geometric punctuation. Breaks vertical rhythm without being heavy. Adds the "designed" feel.
**Risk:** None. Static markup.

---

### PHASE 3: LIVE MARKET AMBIENT — 20 Minutes

*The page should feel like a Bloomberg terminal, not a pdf.*

#### 3.1 — Top Market Ticker Bar (15 min) — **P0**

**File:** `src/components/market-ticker.tsx` (new)
**What:** Fixed bar at top of viewport, 40px height:

```text
● OFFERING OPEN · 2 OF 3 ALLOC · FLOOR $15K · CLOSES 04d 11h 22m 09s
```

- `bg-surface-raised/90 backdrop-blur-sm border-b border-border/30`
- Pulsing green dot (reuse accent pulse animation)
- `font-mono text-xs text-text-secondary`
- Countdown reuses `getTimeRemaining` from existing `deadline.ts`
- Appears after boot sequence completes (pass `bootComplete` state)
- When hero CTA is NOT visible AND bid section is NOT visible: adds a "Request Allocation →" button on the right side (merges sticky CTA concept)
- Hidden when expired
- z-index: 40

**Data:** Pull `remaining_slots` from the same `/api/slots` fetch already in `BidSection`. Lift to page-level or use a shared ref.

**Why:** Persistent scarcity. Persistent urgency. Persistent buy button. Three conversion essentials, one component.
**Risk:** Low. Simple component. Use `IntersectionObserver` on hero and bid section refs to toggle CTA visibility.

#### 3.2 — Page Body Padding Adjustment (2 min) — **P1**

**File:** `src/app/partners/page.tsx`
**What:** Add `pt-10` (40px) to `<main>` to account for the fixed ticker bar height.
**Risk:** None.

#### 3.3 — Social Proof Micro-Copy (3 min) — **P1**

**File:** `src/components/sections/hero.tsx`
**What:** Below the existing hero CTA, add:

```tsx
<p className="mt-3 text-xs text-text-muted font-mono">
  {stats.strikeNow} accounts currently in the pipeline
</p>
```

Pull `strikeNow` from `/api/stats` or use `FALLBACK_STATS.strikeNow`.
**Why:** Tiny. Deniable. Creates competitive pressure. Oren Klaff's "you're not the only one" frame.
**Risk:** None. Static text with a real number.

---

### PHASE 4: SCROLL CHOREOGRAPHY — 20 Minutes

*No new dependencies. CSS keyframes + existing IntersectionObserver.*

#### 4.1 — Section Reveal Animations (10 min) — **P1**

**Files:** All section components
**What:** Each section wraps its content in a div that starts `opacity-0 translate-y-10` and transitions to `opacity-100 translate-y-0` when `isInView` is true. Most sections already use `useInView` — just extend to add the transform.

Pattern (already exists in receipts.tsx, extend to all):

```tsx
className={`... transition-all duration-700 ease-out ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
```

Sections that need `useInView` added: `hero.tsx`, `bid-section.tsx`, `deadline-section.tsx`, `operator-close.tsx`.
**Risk:** Low. Your `useInView` hook is already built and tested.

#### 4.2 — Stat Counter Stagger (10 min) — **P1**

**File:** `src/components/sections/receipts.tsx`
**What:** Add stagger delay to stat cards using CSS custom property:

```tsx
<div style={{ '--i': i } as React.CSSProperties}>
```

```css
.stat-card {
  animation: fadeInUp 0.5s ease-out both;
  animation-delay: calc(var(--i) * 100ms);
}
```

The counters already animate on intersection. This adds entrance stagger to the cards themselves.
**Risk:** None. CSS animation-delay.

---

### PHASE 5: CONVERSION DEPTH — 25 Minutes

<!-- The difference between "pretty page" and "pipeline machine." -->

#### 5.1 — Bid Flow Focus Mode (10 min) — **P1**

**File:** `src/components/bid/bid-flow.tsx`
**What:** When `step >= 2` (user has entered the deal room):

- Render a `fixed inset-0 bg-black/30 z-30` overlay behind the bid card
- Bid card gets `relative z-35 ring-1 ring-accent/20 shadow-[0_0_60px_rgba(0,255,194,0.06)]`
- Add "Step X of 4" label: `font-mono text-xs text-accent mb-4` above each step's content
- On mobile, auto-scroll to bid section top when advancing steps

**Why:** This is commitment escalation. Once they enter the bid flow, the world fades away. They're in the deal room. Reduces visual distraction. Creates psychological lock-in.
**Risk:** z-index coordination with ticker (z-40 stays above). Test mobile scroll behavior.

#### 5.2 — Hero Cursor Glow (10 min) — **P2**

**File:** `src/components/sections/hero.tsx`
**What:** Desktop-only. On `mousemove`, update CSS custom properties `--mouse-x` and `--mouse-y`. Apply a `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(0,255,194,0.04), transparent 40%)` as a pseudo-element on the hero section.
**Why:** "The page sees you." Subtle ambient response. Premium feel. Zero performance cost — CSS only, no React re-renders.
**Risk:** Low. Disable on touch devices via `@media (hover: hover)`.

#### 5.3 — Footer Trust Strip (5 min) — **P1**

**File:** `src/app/partners/page.tsx` (footer)
**What:** Replace existing footer with:

```tsx
<footer className="py-8 px-6 text-center border-t border-border">
  <div className="text-xs font-mono text-text-muted space-x-3">
    <span>SHA-256 Secured</span>
    <span className="text-accent/40">·</span>
    <span>ESIGN Compliant</span>
    <span className="text-accent/40">·</span>
    <span>Invite-Only Platform</span>
  </div>
  <div className="mt-2 text-xs text-text-muted/50">
    DWTB?! Studios © {new Date().getFullYear()}
  </div>
</footer>
```

**Why:** Trust signals at the scroll bottom catch the "I read everything, still deciding" audience. "Invite-Only Platform" reframes the experience as exclusive access.
**Risk:** None.

---

### PHASE 6: SECONDARY CONVERSION PATH (Stretch, +15 min)

*Only if Phases 1-5 complete with time remaining.*

#### 6.1 — Warm-Up Ghost CTA (5 min) — **P2**

**File:** `src/components/sections/hero.tsx`
**What:** Below the primary CTA, add a secondary ghost button:

```tsx
<a href="mailto:casey@dwtb.dev?subject=Q2%20GTM%20Briefing%20Request"
   className="mt-3 inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg text-text-secondary text-sm hover:border-accent/50 hover:text-accent transition-colors">
  Or: Talk to Casey First →
</a>
```

**Why:** The jump from "reading" to "$15K bid" is a commitment cliff. This catches the interested-but-not-ready segment. A warm lead is infinitely more valuable than a bounce.

#### 6.2 — Early Email Capture in Bid Step 1 (10 min) — **P2**

**File:** `src/components/bid/bid-flow.tsx`
**What:** In Step 1 (Review Offer), add a single email field below the offer summary:

```text
Interested? Enter your email to begin. →
```

When submitted, advances to Step 2 with email pre-filled. If they bounce after Step 1, you have their email for follow-up.
**Why:** Currently, 100% of Step 1→Step 2 drop-offs produce zero data. This captures intent.
**Risk:** Low. Email validation already exists in Step 2. Just move it earlier.

---

## TIMING SUMMARY

| Phase | Time | Cumulative | Impact |
| ----- | ---- | ---------- | ------ |
| **Phase 1:** Noise + Glow + Glass | 15 min | 15 min | Instant premium transformation |
| **Phase 2:** Typography + Dividers | 10 min | 25 min | Visual authority established |
| **Phase 3:** Ticker Bar + Social Proof | 20 min | 45 min | Live market ambient feel |
| **Phase 4:** Scroll Choreography | 20 min | 65 min | Cinematic page experience |
| **Phase 5:** Focus Mode + Cursor + Trust | 25 min | 90 min | Conversion depth |
| **Phase 6:** Secondary CTA + Email (stretch) | 15 min | 105 min | Pipeline capture |

**Buffer: 15 min** for testing, mobile checks, and edge cases.
**Total: ~2 hours.**

---

## FILE CHANGE MAP

| File | Changes |
| ---- | ------- |
| `src/app/globals.css` | Noise overlay, glow utility, stagger animation |
| `src/app/partners/page.tsx` | Ticker import, divider lines, footer trust strip, `pt-10` |
| `src/components/market-ticker.tsx` | **NEW** — Top ticker bar with integrated sticky CTA |
| `src/components/sections/hero.tsx` | Tracking-tight, social proof micro-copy, cursor glow, ghost CTA |
| `src/components/sections/receipts.tsx` | Typography bump, glass cards, stat stagger delay |
| `src/components/sections/video-stage.tsx` | Typography bump, useInView reveal transition |
| `src/components/sections/bid-section.tsx` | Typography bump, useInView reveal transition |
| `src/components/sections/deadline-section.tsx` | Typography bump, useInView reveal transition |
| `src/components/sections/operator-close.tsx` | Typography bump, useInView reveal transition |
| `src/components/bid/bid-flow.tsx` | Focus mode overlay, step labels, glass card |

**New files:** 1 (`market-ticker.tsx`)
**Modified files:** 9
**Deleted files:** 0
**New dependencies:** 0

---

## WHAT THIS DOES NOT INCLUDE (AND WHY)

| Killed Item | Reason |
| ----------- | ------ |
| Framer Motion dependency | 32KB gzipped, React 19/Next 16 SSR risk, we can do the same with CSS |
| Parallax hero | Requires RAF + mobile Safari debugging. 15 min → 45 min when it breaks |
| CRT boot sequence effects | Gimmicky. Undermines institutional credibility |
| Ambient notification toasts | Fake social proof risk. Interrupts commitment flow |
| Asymmetric layouts | Layout rewrite in a 2-hour sprint = shipping bugs |
| Spring physics | CSS ease-out is visually identical for simple reveals |
| Product tier cards | Sprint V2 Sprint 4.6 — not a visual sprint item |
| Level 2 order book | Sprint V2 Sprint 5 — not a visual sprint item |
| Stepper/progress bar | "Step X of 4" label achieves same clarity in 2 min vs 15 min |

---

## QUALITY GATES

Before pushing:

- [ ] Desktop viewport (1440px): all sections render, no horizontal overflow
- [ ] Mobile viewport (375px): ticker bar readable, bid form usable, no CTA overlap
- [ ] Noise overlay: visible but subtle (bump to 0.04 if too faint, kill if distracting)
- [ ] Ticker bar: shows accurate slot count and countdown
- [ ] CTA glow: renders on hover, no layout shift
- [ ] Glass cards: backdrop-blur visible, not muddy
- [ ] Section reveals: smooth, no jank, no flash-of-unstyled-content
- [ ] Bid flow focus mode: overlay doesn't block ticker, bid card is accessible
- [ ] Boot sequence still works (not broken by ticker z-index)
- [ ] Run `npm run build` — zero errors
- [ ] Run `npx vitest run` — all existing tests pass

---

## PANEL GRADE: A

**What upgraded this from B+ to A:**

1. Killed all dependency risk (no framer-motion, no parallax)
2. CSS-first execution = faster, safer, reversible
3. Merged sticky CTA into ticker bar (one component, not two)
4. Added secondary conversion path (ghost CTA + early email)
5. Added commitment escalation (focus mode overlay)
6. Clear kill list prevents scope creep
7. Quality gates prevent shipping broken

**The frame:** When a freight VP lands on this page, they won't think "nice landing page." They'll think: "If he built THIS to sell his services — a live offering platform with market data, institutional language, and a signed contract in 3 minutes — imagine what he'd build for my pipeline."

That's the pitch. The platform IS the pitch.

---

*Sprint plan reviewed by: Senior Graphic Designer, Conversion Specialist, Digital Brokerage Platform Engineer. Consensus: ship it.*
