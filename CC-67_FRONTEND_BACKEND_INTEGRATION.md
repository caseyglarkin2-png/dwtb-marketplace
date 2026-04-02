# CC-67: Frontend ↔ Backend Integration Sprint Plan
## DWTB?! Studios — "Get Connected to the Mothership"
### April 2, 2026

---

## DIAGNOSIS: WHERE WE ARE

### The Good News
The site (dwtb.dev) is live, polished, and doesn't look broken. The architecture is **correct**: Browser → Vercel (Next.js route handlers) → Railway (Clawd Control Plane). The BFF pattern is right. The `clawd.ts` client library already has every function we need: `createBid()`, `getBids()`, `updateBid()`, `getSlots()`, `getPipeline()`, `getLeadStats()`.

### The Bad News
**Nothing is actually connected.** Every API call to Railway silently fails and falls back to hardcoded constants. The site looks alive but it's a mannequin — no real slot data, no real stats, no real bid flow. Specifically:

| # | Issue | Impact |
|---|-------|--------|
| 1 | No `.env.local` in Codespace | Can't develop locally against Railway at all |
| 2 | `/api/stats` silently returns `FALLBACK_STATS` | Stats are frozen fiction |
| 3 | `/api/slots` silently returns `DEFAULT_TOTAL_SLOTS` | Slot count is a constant, not live inventory |
| 4 | No health check endpoint | No way to verify Railway is reachable |
| 5 | No logging on `clawdFetch` failures | Failures are invisible |
| 6 | No timeout on `clawdFetch` | Hanging requests block users |
| 7 | No retry on transient Railway errors | One blip = failed request |
| 8 | Fallbacks don't tell anyone they're fallbacks | Operator has no idea they're seeing stale data |
| 9 | Bid submission has no error recovery UX | Railway 503 = user sees generic error, no retry |
| 10 | Admin panel can't tell if Railway is up or down | Casey flies blind |

### What We're NOT Doing
- ~~Stripe Invoicing~~ — **cut**. Payments are manual for now. Casey marks paid.
- ~~UI redesign / copy reframe~~ — already planned elsewhere (SPRINT-PLAN-V2.md, SPRINT-UI-V2.md)
- ~~Product tier cards / order book~~ — comes after connectivity
- ~~Database migration~~ — backend is JSONL on Railway volume, that's fine
- ~~Supabase~~ — doesn't exist, never will

---

## THE PLAN: 3 SPRINTS, RAILWAY ONLY

**Sprint 1**: Wire it up (env, health, logging, verify contracts)
**Sprint 2**: Verify every data flow (slots, stats, bids, admin — all against live Railway)  
**Sprint 3**: Harden for launch (timeouts, retries, caching, error recovery, admin visibility)

Each sprint is demoable. Each task is one commit with tests.

---

## SPRINT 1: "Plug It In" — Local Dev + Health + Contract Verification
> **Goal**: `npm run dev` in Codespace talks to Railway. We can see if it's connected.
> **Demo**: Open `/api/health` → green. Open `/partners` → live slot count from Railway.

### 1.1: Create `.env.local.example`
**File**: `.env.local.example` (new)
**Content**:
```env
# Railway Backend (Clawd Control Plane)
RAILWAY_API_URL=https://clawd-control-plane-production.up.railway.app
RAILWAY_API_TOKEN=your-token-here

# Admin Auth
ADMIN_PASSWORD=your-admin-password
ADMIN_SECRET=minimum-16-char-secret-here

# Email (optional — skips if missing)
RESEND_API_KEY=
ADMIN_EMAIL=casey@dwtb.dev

# Rate Limiting (optional — disabled if missing)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Bidding Controls
MAX_BID_AMOUNT=500000
MANUALLY_CLOSED=false
```
**Validation**: File exists. `.gitignore` has `.env.local`.
**Test**: `test -f .env.local.example && grep -q '.env.local' .gitignore`

---

### 1.2: Add `/api/health` endpoint
**File**: `src/app/api/health/route.ts` (new)
**Does**:
- GET → pings Railway `/api/slots/status` with 5s timeout
- Returns:
```json
{
  "status": "ok" | "down",
  "railway_online": true,
  "latency_ms": 142,
  "timestamp": "2026-04-02T..."
}
```
- Admin-protected via `validateAdminRequest`
- Never exposes secrets
**Tests**:
- Railway up → `{ status: "ok", railway_online: true }`
- Railway down → `{ status: "down", railway_online: false }`
- No admin auth → 401

---

### 1.3: Add `clawdFetch` logging
**File**: `src/lib/clawd.ts`
**Changes**:
- Log on success: `[Clawd] GET /api/slots/status → 200 (142ms)`
- Log on failure: `[Clawd] GET /api/slots/status → FAILED: 503 (timeout)`
- Never log token or full URL
- Add timing via `performance.now()` or `Date.now()`
**Tests**:
- Mock fetch success → logs method, path, status, latency
- Mock fetch failure → logs warning, no secrets

---

### 1.4: Add `checkClawdConnection()` utility
**File**: `src/lib/clawd.ts`
**Changes**:
- Export async function: `checkClawdConnection() → { connected: boolean, latency: number, error?: string }`
- Calls `getSlots()`, measures time
- Used by `/api/health`
**Tests**:
- Railway responds → `{ connected: true, latency: N }`
- Railway fails → `{ connected: false, error: "..." }`

---

### 1.5: Verify Railway API contracts
**Does**:
- Curl each Railway endpoint, compare response shape to TypeScript types in `clawd.ts`:
  - `GET /api/slots/status` → matches `SlotsStatus`?
  - `GET /api/marketplace/bids` → matches `{ total, bids: ClawdBid[] }`?
  - `GET /api/dwtb-pipeline` → matches `PipelineResponse`?
  - `POST /api/marketplace/bid` → matches `ClawdBid`?
  - `GET /api/marketplace/bid/{id}/status` → does it even exist?
- Create `src/lib/__tests__/contract-shapes.test.ts` — Zod schemas that validate Railway response shapes. Any mismatch = failing test = we fix it before moving forward.
**Validation**: All shapes match or mismatches documented as blocking issues.

---

### 1.6: Create shared API response schemas
**File**: `src/lib/api-types.ts` (new)
**Does**:
- Zod schemas for the 4 responses that matter:
  - `SlotsResponseSchema` (what `/api/slots` returns to frontend)
  - `StatsResponseSchema` (what `/api/stats` returns to frontend)
  - `BidSubmitResponseSchema` (what `/api/bids` POST returns)
  - `HealthResponseSchema` (what `/api/health` returns)
- Export TypeScript types: `type SlotsResponse = z.infer<typeof SlotsResponseSchema>`
- Used by route handlers to validate output + by tests
**Tests**:
- Schemas validate example payloads
- Schemas reject missing required fields

---

### 1.7: Update README with local dev setup
**File**: `README.md`
**Changes**:
- "Local Development" section:
  1. `cp .env.local.example .env.local`
  2. Fill in `RAILWAY_API_TOKEN`
  3. `npm install && npm run dev`
  4. `http://localhost:3000/api/health` → should say `"ok"`
**Test**: README contains "Local Development" heading.

---

### 1.8: Sprint 1 test suite
**File**: `src/lib/__tests__/clawd-connection.test.ts` (new)
**Does**:
- 5 tests for `clawdFetch`: success, 401, 500, timeout, network error
- 3 tests for `checkClawdConnection`: success, failure, latency
- Verify error messages never contain env var values
**Validation**: `npm run test:run` — 8+ tests pass.

---

**Sprint 1 Demo**: `npm run dev` → `/api/health` → `{ status: "ok", railway_online: true, latency_ms: 130 }`. Open `/partners` → real slot count from Railway. If Railway is down → fallback with console warning.

---

## SPRINT 2: "Prove the Flow" — Every Route Verified Against Railway
> **Goal**: Full bid lifecycle works end-to-end with live Railway data.
> **Demo**: Submit bid on `/partners` → appears in `/admin` → change status → check public status → all Railway data.

### 2.1: Verify + fix `/api/slots` route
**File**: `src/app/api/slots/route.ts`
**Does**:
- Validate Railway `SlotsStatus` response with Zod (from 1.6)
- Transform Railway shape → frontend shape:
  - `remaining` = `slotsStatus.available`
  - `total` = `slotsStatus.total`
  - `accepted` = `slotsStatus.committed + slotsStatus.sold`
- Add `_source: "live" | "fallback"` to response
- If Railway returns unexpected shape → log warning, return fallback
**Tests**:
- Railway returns valid → transformed correctly, `_source: "live"`
- Railway returns garbage → fallback with warning, `_source: "fallback"`
- Railway down → fallback, `_source: "fallback"`

---

### 2.2: Verify + fix `/api/stats` route
**File**: `src/app/api/stats/route.ts`
**Does**:
- Validate Railway `PipelineResponse` with Zod
- Transform to frontend shape: `{ proposalsSent, totalViews, viewRate, pipelineValue, strikeNow }`
- Calculate from real pipeline data:
  - `proposalsSent` = deals past `proposal_sent` stage
  - `pipelineValue` = `stats.active_pipeline_value`
  - `strikeNow` = deals in `strike_now` or `meeting` stage
- Add `_source: "live" | "fallback"`
**Tests**:
- Railway pipeline → correct transform
- Railway fail → `FALLBACK_STATS` with `_source: "fallback"`

---

### 2.3: Verify `/api/bids` POST creates bid on Railway
**File**: `src/app/api/bids/route.ts`
**Does**:
- Validate Railway response matches `ClawdBid` shape
- If Railway returns bid without `bid_id` → error (don't silently succeed)
- Log: `[Bids] Created bid ${bid_id} for ${company} — $${amount}`
- If `createBid()` fails → structured error with `retry: true` for transient failures
**Tests**:
- Mock success → response has `bid_id`, `status`, `signature_hash`
- Mock Railway 400 → validation error surfaced to user
- Mock Railway 500 → `{ error: "submission_failed", retry: true }`

---

### 2.4: Verify `/api/admin/bids` returns bids from Railway
**File**: `src/app/api/admin/bids/route.ts`
**Does**:
- Validate `getBids()` response with Zod
- Empty bids → `{ bids: [], total: 0 }` (not an error)
- Malformed data → log warning, return what's parseable
- Railway down → 503 with `"Backend unavailable"`
**Tests**:
- Mock bids → all fields present
- Mock empty → clean empty response
- Mock down → 503

---

### 2.5: Verify `/api/admin/bids/[id]/status` PATCH
**File**: `src/app/api/admin/bids/[id]/status/route.ts`
**Does**:
- Log: `[Admin] Bid ${bid_id}: ${old_status} → ${new_status}`
- Verify Railway response reflects new status
- Return updated bid to frontend
**Tests**:
- Mock success → updated status in response
- Mock 404 → "Bid not found"
- Mock invalid transition → rejected

---

### 2.6: Conditional `getBid()` optimization
**File**: `src/lib/clawd.ts`
**Does**:
- If Sprint 1.5 confirmed `/api/marketplace/bid/{id}/status` exists:
  → Add `getBidById(bidId)` that calls it directly
- If endpoint doesn't exist:
  → Keep current approach (filter from `getBids()`), file backend ticket
- Either way, acceptable for launch (<50 bids expected)
**Tests**:
- Correct endpoint called
- Bid-not-found handled gracefully

---

### 2.7: Add correlation IDs to `clawdFetch`
**File**: `src/lib/clawd.ts`
**Changes**:
- Generate `X-Request-ID` (random hex, 8 chars) per `clawdFetch` call
- Send in request headers
- Include in logs: `[Clawd][req-a1b2c3d4] GET /api/slots/status → 200 (142ms)`
**Tests**:
- Header sent on every request
- ID appears in logs
- ID is unique per call

---

### 2.8: Sprint 2 integration test
**File**: `src/lib/__tests__/data-flow.test.ts` (new)
**Does**:
- Mocked end-to-end flow:
  1. `getSlots()` → transform → matches `SlotsResponseSchema`
  2. `getPipeline()` → transform → matches `StatsResponseSchema`
  3. `createBid(data)` → returns valid bid
  4. `getBids()` → contains the created bid
  5. `updateBid(id, { status: "accepted" })` → status changed
- Verify error messages don't leak internals
**Validation**: `npm run test:run` passes.

---

**Sprint 2 Demo**: Go to `/partners` → submit a bid with real data → see it in `/admin` → accept it from admin panel → check `/api/bids/status?ref=BID_ID&email=test@example.com` → status is "accepted". All data from Railway.

---

## SPRINT 3: "Battle Ready" — Resilience + Admin Visibility
> **Goal**: Site survives Railway blips gracefully. Casey knows what's happening. Users get clear error feedback.
> **Demo**: Kill Railway → site still loads with fallback + admin sees red badge. Restore → auto-recovers.

### 3.1: Add request timeout to `clawdFetch`
**File**: `src/lib/clawd.ts`
**Changes**:
- `AbortController` with configurable timeout (default 8s)
- Allow per-call override: `clawdFetch(path, { timeout: 3000 })`
- On timeout: `Clawd timeout: GET /path (8000ms)`
**Tests**:
- Slow response → timeout fires
- Fast response → no interference
- Custom timeout works

---

### 3.2: Add retry logic to `clawdFetch`
**File**: `src/lib/clawd.ts`
**Changes**:
- On 502/503/504 or network error: retry once after 1s (GET only)
- Zero retries for POST/PATCH (write safety)
- On 429: respect `Retry-After` or wait 2s
- Log retry attempts
**Tests**:
- GET 503 then 200 → retry succeeds
- POST 503 → NO retry
- 502 then 502 → gives up after 1 retry

---

### 3.3: Add `_source` field to all read routes
**Files**: `src/app/api/slots/route.ts`, `src/app/api/stats/route.ts`, `src/app/api/admin/bids/route.ts`, `src/app/api/admin/stats/route.ts`
**Changes**:
- All GET responses include `_source: "live" | "fallback" | "cached"`
- Write routes (POST/PATCH) do NOT include `_source`
**Tests**: Every read route returns `_source` in all code paths.

---

### 3.4: Stale-while-revalidate cache for slots and stats
**File**: `src/lib/cache.ts` (new)
**Does**:
- In-memory cache with TTL:
  - `slots`: 30s fresh, stale up to 5min
  - `stats`: 60s fresh, stale up to 10min
- Cache miss → fetch Railway
- Cache hit (fresh) → return cached
- Cache stale → return stale + background revalidate
- Railway down + stale cache → return cached with `_source: "cached"`
- Railway down + no cache → return fallback with `_source: "fallback"`
- Export `invalidateCache(key)` for admin actions
**Tests**:
- Fresh hit → no fetch
- Stale → returns stale + revalidates
- Railway down + stale → cached data
- Railway down + no cache → fallback
- `invalidateCache("slots")` → next fetch goes to Railway

---

### 3.5: Admin connectivity badge
**File**: `src/app/admin/page.tsx`
**Changes**:
- On mount + every 60s: call `/api/health`
- Display in header: 🟢 Connected / 🔴 Disconnected
- If disconnected: "Backend unreachable — showing cached/fallback data"
**Tests**:
- Health OK → green badge
- Health down → red badge + warning

---

### 3.6: Frontend fallback indicator
**Files**: `src/components/sections/receipts.tsx`, `src/components/sections/hero.tsx`
**Changes**:
- When `_source === "fallback"`: subtle `(cached)` label next to stats
- When `_source === "live"`: subtle pulsing green dot
- Non-intrusive
**Tests**:
- Live → green dot
- Fallback → "(cached)" label

---

### 3.7: Bid submission error recovery
**File**: `src/app/api/bids/route.ts`, `src/components/bid/bid-flow.tsx`
**Changes**:
- API: `createBid()` failure → `{ error: "submission_failed", message: "Unable to submit. Please try again.", retry: true }`
- Frontend: on `retry: true` → show retry button
- On validation/deadline errors → show final message, no retry
**Tests**:
- Railway 503 → retry button shown
- Railway 400 → validation error, no retry
- Deadline passed → "offering closed"

---

### 3.8: Launch readiness endpoint
**File**: `src/app/api/admin/readiness/route.ts` (new)
**Does**:
- GET (admin-protected):
```json
{
  "ready": true,
  "checks": {
    "railway_connected": { "pass": true, "detail": "142ms" },
    "slots_remaining": { "pass": true, "detail": "2 of 3" },
    "deadline_in_future": { "pass": true, "detail": "4d 11h" },
    "admin_secret_set": { "pass": true }
  }
}
```
- `ready` = all checks pass
**Tests**:
- All green → ready
- Railway down → not ready
- Deadline passed → not ready

---

### 3.9: Sprint 3 resilience test suite
**File**: `src/lib/__tests__/resilience.test.ts` (new)
**Does**:
- Tests timeout behavior
- Tests retry logic (GET vs POST)
- Tests cache under failure modes
- Tests fallback data matches `FALLBACK_STATS` shape
**Validation**: `npm run test:run` passes.

---

**Sprint 3 Demo**: Start app → all green. Set `RAILWAY_API_URL` to garbage → site still loads, shows fallback, admin sees 🔴. Fix URL → everything recovers, badges go green, cache refreshes. Hit `/api/admin/readiness` → all checks green.

---

## TASK SUMMARY

| Sprint | Tasks | Focus | Outcome |
|--------|-------|-------|---------|
| **1** | 1.1 – 1.8 | Plug it in | Dev talks to Railway, contracts verified |
| **2** | 2.1 – 2.8 | Prove the flow | Full bid lifecycle end-to-end with live data |
| **3** | 3.1 – 3.9 | Battle ready | Survives Railway downtime, admin sees status |

**Total**: 25 atomic tasks across 3 sprints.

### ROLLBACK STRATEGY

1. **Railway is down**: Set `MANUALLY_CLOSED=true` on Vercel → "Offering Closed" gracefully.
2. **clawdFetch completely broken**: Hotfix — all routes return constants. Bids via email.
3. **Bad deploy**: Vercel instant rollback via dashboard.
4. **Deadline**: No code changes after April 6, 6 PM ET.

---

## DEPENDENCY GRAPH

```
1.1 (.env.local.example) ─── independent
1.2 (/api/health) ←── depends on 1.1
1.3 (clawd logging) ←── independent
1.4 (connection check) ←── depends on 1.3
1.5 (contract verify) ←── depends on 1.1 (needs Railway connection)
1.6 (api-types) ←── PARALLELIZABLE (no Railway dependency)
1.7 (README) ←── depends on 1.1
1.8 (Sprint 1 tests) ←── depends on 1.2, 1.3, 1.4

2.1 (slots verify) ←── depends on 1.5, 1.6
2.2 (stats verify) ←── depends on 1.5, 1.6
2.3 (bids POST verify) ←── depends on 1.5
2.4 (admin bids verify) ←── depends on 1.5
2.5 (admin status verify) ←── depends on 2.4
2.6 (getBid optimize) ←── depends on 1.5 (need to know if endpoint exists)
2.7 (correlation IDs) ←── depends on 1.3
2.8 (Sprint 2 tests) ←── depends on 2.1–2.7

3.1 (timeout) ←── independent
3.2 (retry) ←── depends on 3.1
3.3 (_source field) ←── depends on 2.1, 2.2
3.4 (cache) ←── depends on 3.3
3.5 (admin badge) ←── depends on 1.2
3.6 (frontend indicators) ←── depends on 3.3
3.7 (bid error recovery) ←── depends on 2.3
3.8 (readiness endpoint) ←── depends on 1.2
3.9 (Sprint 3 tests) ←── depends on 3.1–3.8
```

---

## WHAT'S EXPLICITLY OUT OF SCOPE

| Not Included | Why |
|-------------|-----|
| Stripe / payments | Cut. Manual for now. |
| Copy reframe | Already in SPRINT-PLAN-V2.md Sprint 4 |
| UI redesign | Already in SPRINT-UI-V2.md |
| Product tiers / order book | Comes after connectivity |
| Database migration | Backend is JSONL, that's fine |
| Supabase | Doesn't exist |
| WebSockets | Polling is fine for launch |
| Invite token persistence | Nice-to-have, post-launch |
| Audit trail persistence | Console logging is enough for launch |
