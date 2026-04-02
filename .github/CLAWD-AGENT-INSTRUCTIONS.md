# Clawd Control Plane — Agent Instructions

## For agents working on the Railway Python backend

> **Drop this file into the clawd-control-plane repo as `.github/copilot-instructions.md`**
> or paste it into any agent's system prompt when working on the backend.

---

## What This Service Is

**clawd-control-plane** is a Python API running on Railway.

- Railway project: `dazzling-spirit`
- Service: `clawd-control-plane`
- URL: `https://clawd-control-plane-production.up.railway.app`
- Storage: JSONL files on `clawd-control-plane-volume` (Railway persistent volume)
- Auth: `MC_API_TOKEN` env var — clients send `Authorization: Bearer {token}`

## Who Calls Us

The **only** consumer of this API is **dwtb-marketplace** — a Next.js app deployed on **Vercel** at `https://dwtb.dev`. It calls us through server-side API route handlers (BFF pattern). Browser traffic never hits Railway directly.

```text
Browser → dwtb.dev (Vercel/Next.js)
            └─ API Route Handlers
                 └─ clawdFetch() → THIS SERVICE (Railway)
```

The frontend authenticates using `RAILWAY_API_TOKEN` (= our `MC_API_TOKEN`).

## API Contract — LOCKED (April 2, 2026)

The frontend depends on these exact response shapes. **Do not change field names, nesting, or types without coordinating with dwtb-marketplace.**

### GET /api/slots/status

```json
{
  "slots": [{"id": "slot-1", "status": "available"}, {"id": "slot-2", "status": "available"}, {"id": "slot-3", "status": "available"}],
  "available": 3,
  "held": 0,
  "committed": 0,
  "sold": 0,
  "total": 3,
  "access_mode": "private",
  "quarter": "Q2-2026",
  "price_monthly": 10000,
  "engagement_months": 3
}
```

- `status` values for slots: `"available"`, `"held"`, `"committed"`, `"sold"`
- Frontend reads: `available`, `total`, `committed + sold` (as "accepted")

### POST /api/marketplace/bid

Request body:

```json
{
  "company": "Acme Corp",
  "name": "Jane Doe",
  "email": "jane@acme.com",
  "bid_amount": 10000,
  "tier": "growth",
  "contract_version": "Q2-2026-v2.0",
  "signature_hash": "sha256-hex-of-typed-name"
}
```

Response: full bid object with `bid_id` assigned.

### GET /api/marketplace/bids

```json
{
  "total": 0,
  "bids": [
    {
      "bid_id": "uuid",
      "company": "Acme Corp",
      "name": "Jane Doe",
      "email": "jane@acme.com",
      "bid_amount": 10000,
      "status": "pending",
      "tier": "growth",
      "contract_version": "Q2-2026-v2.0",
      "signature_hash": "...",
      "created_at": "ISO-8601",
      "updated_at": "ISO-8601"
    }
  ]
}
```

- Used by admin panel. Returns **full** bid data including email/name.

### GET /api/marketplace/bid/{id}/status

```json
{
  "bid_id": "uuid",
  "company": "Acme Corp",
  "status": "pending",
  "bid_amount": 10000,
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

- **LITE endpoint** — intentionally excludes `email` and `name` for public-facing status checks.

### PATCH /api/marketplace/bid/{id}

Request body:

```json
{
  "status": "accepted",
  "status_note": "Welcome aboard"
}
```

- Valid status transitions:
  - `submitted` → `accepted` | `declined` | `waitlisted`
  - `waitlisted` → `accepted` | `declined`
  - `accepted` → `paid` | `declined`
  - `paid` → `onboarded`
- Returns: full updated bid object

### GET /api/dwtb-pipeline

```json
{
  "deals": [...],
  "total": 47,
  "stats": {
    "total_deals": 47,
    "by_stage": {
      "lead": 17, "qualified": 0, "proposal": 30,
      "negotiation": 0, "closed_won": 0, "closed_lost": 0
    },
    "total_pipeline_value": 485000,
    "active_pipeline_value": 485000,
    "won_value": 0, "won_count": 0, "lost_count": 0, "win_rate_pct": 0,
    "stages": ["lead","qualified","proposal","negotiation","closed_won","closed_lost"],
    "stage_labels": {"lead": "Lead", "qualified": "Qualified", ...}
  }
}
```

### GET /api/intake/leads/stats

```json
{
  "total": 0, "new": 0, "last_24h": 0,
  "top_source": "", "by_source": {}, "by_intent": {}
}
```

## What Does NOT Exist

- **Supabase** — there is no Supabase. Data lives in JSONL on Railway volume. If you see Supabase references in the old clawd-control-plane repo manifests, they are fiction.
- **dwtb-postgres** — deleted April 2, 2026. Was an orphaned Railway Postgres service, never connected.
- **6 Postgres tables** — described in stale manifests (`schema-digest.md`). Never created.
- **dwtb.com** — does not exist. The domain is `dwtb.dev`.

## Railway Environment Variables (This Service)

The backend has 42 service variables. The ones relevant to the frontend contract:

- `MC_API_TOKEN` — the auth token. Frontend sends this as `Authorization: Bearer {token}`
- `RAILWAY_BASE_URL` — the public URL of this service

Other vars (Gemini, Google, HubSpot, OpenAI, ElevenLabs, Brave, etc.) are for the backend's own AI/CRM plumbing and do not affect the frontend API contract.

## Coordination Rules

1. **Do NOT rename or restructure API response fields** without updating the frontend. The TypeScript types in `dwtb-marketplace/src/lib/clawd.ts` must match.
2. **New fields are safe to ADD** — the frontend ignores unknown fields.
3. **Removing fields BREAKS the frontend** — always coordinate first.
4. **Auth changes** (new token, different header) require updating Vercel env vars on the frontend.
5. **If you add a new endpoint**, document it here and tell the frontend team to add a function in `clawd.ts`.

## How to Test the Contract

From the frontend repo (dwtb-marketplace):

```bash
source .env.local
curl -s -H "Authorization: Bearer $RAILWAY_API_TOKEN" "$RAILWAY_API_URL/api/slots/status" | python3 -m json.tool
```

Or from the Railway CLI:

```bash
cd clawd-control-plane && railway link -p dazzling-spirit -s clawd-control-plane -e production
railway run curl -s http://localhost:$PORT/api/slots/status
```
