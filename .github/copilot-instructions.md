# DWTB?! Studios — Copilot Workspace Instructions

## Identity Crisis Resolution (READ THIS FIRST)

There are THREE things that sound similar but are DIFFERENT:

| Name | What It Is | Where It Lives | Status |
|------|-----------|----------------|--------|
| **dwtb-marketplace** | Next.js 16 frontend (THIS REPO) | GitHub → Vercel (dwtb.dev) | ACTIVE — source of truth for UI |
| **clawd-control-plane** | Python API backend (REAL) | Railway (clawd-control-plane-production.up.railway.app) | ACTIVE — source of truth for data |
| **clawd-control-plane repo** | Deployment scripts + stale manifests | GitHub (in codespace) | STALE — describes architecture that doesn't exist |

### The Real Architecture (April 2026)

```
Browser → dwtb.dev (Vercel)
            │
                        ├─ Next.js App Router (pages)
                                    ├─ API Route Handlers (BFF layer)
                                                │     │
                                                            │     └─ clawd.ts ──→ Railway API (clawd-control-plane-production.up.railway.app)
                                                                        │                       ├─ POST /api/marketplace/bid
                                                                                    │                       ├─ GET  /api/marketplace/bids
                                                                                                │                       ├─ GET  /api/marketplace/bid/{id}/status (lite)
                                                                                                            │                       ├─ PATCH /api/marketplace/bid/{id}
                                                                                                                        │                       ├─ GET  /api/slots/status
                                                                                                                                    │                       ├─ GET  /api/dwtb-pipeline
                                                                                                                                                │                       └─ GET  /api/intake/leads/stats
                                                                                                                                                            │
                                                                                                                                                                        ├─ Resend (email — optional)
                                                                                                                                                                                    └─ Upstash Redis (rate limiting — optional)
                                                                                                                                                                                    ```

                                                                                                                                                                                    ### Verified Railway API Contracts (April 2, 2026 — LIVE)

                                                                                                                                                                                    Auth: `Authorization: Bearer {MC_API_TOKEN}` (= `RAILWAY_API_TOKEN` on Vercel side)

                                                                                                                                                                                    **GET /api/slots/status**
                                                                                                                                                                                    ```json
                                                                                                                                                                                    {
                                                                                                                                                                                      "slots": [{"id": "slot-1", "status": "available"}, ...],
                                                                                                                                                                                        "available": 3, "held": 0, "committed": 0, "sold": 0, "total": 3,
                                                                                                                                                                                          "access_mode": "private", "quarter": "Q2-2026",
                                                                                                                                                                                            "price_monthly": 10000, "engagement_months": 3
                                                                                                                                                                                            }
                                                                                                                                                                                            ```

                                                                                                                                                                                            **GET /api/marketplace/bids**
                                                                                                                                                                                            ```json
                                                                                                                                                                                            { "total": 0, "bids": [] }
                                                                                                                                                                                            ```
                                                                                                                                                                                            Each bid: `{ bid_id, company, name, email, bid_amount, status, tier, contract_version, signature_hash, created_at, updated_at }`

                                                                                                                                                                                            **GET /api/marketplace/bid/{id}/status** (LITE — no email/name)
                                                                                                                                                                                            ```json
                                                                                                                                                                                            { "bid_id": "...", "company": "...", "status": "...", "bid_amount": 0, "created_at": "...", "updated_at": "..." }
                                                                                                                                                                                            ```

                                                                                                                                                                                            **PATCH /api/marketplace/bid/{id}**
                                                                                                                                                                                            Body: `{ "status": "accepted"|"rejected"|"paid", "status_note": "..." }`
                                                                                                                                                                                            Returns: full bid object

                                                                                                                                                                                            **GET /api/dwtb-pipeline**
                                                                                                                                                                                            ```json
                                                                                                                                                                                            {
                                                                                                                                                                                              "deals": [...], "total": 47,
                                                                                                                                                                                                "stats": {
                                                                                                                                                                                                    "total_deals": 47,
                                                                                                                                                                                                        "by_stage": { "lead": 17, "qualified": 0, "proposal": 30, "negotiation": 0, "closed_won": 0, "closed_lost": 0 },
                                                                                                                                                                                                            "total_pipeline_value": 485000, "active_pipeline_value": 485000,
                                                                                                                                                                                                                "won_value": 0, "won_count": 0, "lost_count": 0, "win_rate_pct": 0,
                                                                                                                                                                                                                    "stages": ["lead","qualified","proposal","negotiation","closed_won","closed_lost"]
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                      ```

                                                                                                                                                                                                                      **GET /api/intake/leads/stats**
                                                                                                                                                                                                                      ```json
                                                                                                                                                                                                                      { "total": 0, "new": 0, "last_24h": 0, "top_source": "", "by_source": {}, "by_intent": {} }
                                                                                                                                                                                                                      ```

                                                                                                                                                                                                                      ### What Does NOT Exist

                                                                                                                                                                                                                      - **Supabase** — never built. All references are stale. Backend uses JSONL on Railway volume.
                                                                                                                                                                                                                      - **dwtb-marketplace on Railway** — it's on Vercel, not Railway.
                                                                                                                                                                                                                      - **6 Postgres tables** — fictional. The clawd-control-plane-repo manifests describe them but they were never created.
                                                                                                                                                                                                                      - **dwtb.com** — there is no dwtb.com repo. The domain is dwtb.dev. The site is dwtb-marketplace deployed on Vercel.

                                                                                                                                                                                                                      ### Environment Variables (Actual)

                                                                                                                                                                                                                      The app uses these env vars (set on Vercel production):

                                                                                                                                                                                                                      | Variable | Required | Purpose |
                                                                                                                                                                                                                      |----------|----------|---------|
                                                                                                                                                                                                                      | `RAILWAY_API_URL` | YES | Backend API base URL |
                                                                                                                                                                                                                      | `RAILWAY_API_TOKEN` | YES | Bearer token for Railway API auth |
                                                                                                                                                                                                                      | `ADMIN_PASSWORD` | YES | Admin login |
                                                                                                                                                                                                                      | `ADMIN_SECRET` | YES | HMAC key for admin session cookies |
                                                                                                                                                                                                                      | `RESEND_API_KEY` | no | Email (skips silently if missing) |
                                                                                                                                                                                                                      | `ADMIN_EMAIL` | no | Notification target (default: casey@dwtb.dev) |
                                                                                                                                                                                                                      | `UPSTASH_REDIS_REST_URL` | no | Rate limiting (disabled if missing) |
                                                                                                                                                                                                                      | `UPSTASH_REDIS_REST_TOKEN` | no | Rate limiting (disabled if missing) |
                                                                                                                                                                                                                      | `NEXT_PUBLIC_SITE_URL` | no | Site URL (default: https://dwtb.dev) |
                                                                                                                                                                                                                      | `NEXT_PUBLIC_BASE_URL` | no | Base URL for API routes |
                                                                                                                                                                                                                      | `MAX_BID_AMOUNT` | no | Bid cap (default: 500000) |
                                                                                                                                                                                                                      | `MANUALLY_CLOSED` | no | Kill switch for bidding |

                                                                                                                                                                                                                      **NOT used** (despite appearing in .env.example and clawd-control-plane manifests):
                                                                                                                                                                                                                      - `NEXT_PUBLIC_SUPABASE_URL` — no Supabase
                                                                                                                                                                                                                      - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — no Supabase
                                                                                                                                                                                                                      - `SUPABASE_URL` — no Supabase
                                                                                                                                                                                                                      - `SUPABASE_SERVICE_ROLE_KEY` — no Supabase

                                                                                                                                                                                                                      ## Coding Conventions

                                                                                                                                                                                                                      - **Framework**: Next.js 16 App Router, React 19, TypeScript 6
                                                                                                                                                                                                                      - **Styling**: Tailwind v4 (CSS `@theme` in globals.css, NOT tailwind.config.js)
                                                                                                                                                                                                                      - **Testing**: Vitest + jsdom. Tests in `src/lib/__tests__/`. Run: `npm run test:run`
                                                                                                                                                                                                                      - **Build**: `npx next build` must pass before any PR
                                                                                                                                                                                                                      - **Dark theme**: bg #0A0A0A, accent #00FFC2
                                                                                                                                                                                                                      - **Fonts**: Inter (sans) + JetBrains Mono (mono)
                                                                                                                                                                                                                      - **No Supabase** — if you see Supabase imports or references, they are stale. Remove them.
                                                                                                                                                                                                                      - **Railway API client**: `src/lib/clawd.ts` — all backend communication goes through `clawdFetch()`
                                                                                                                                                                                                                      - **Payments**: Manual. No Stripe. Casey marks paid in admin panel.
                                                                                                                                                                                                                      