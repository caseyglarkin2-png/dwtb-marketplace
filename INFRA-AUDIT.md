# DWTB Infrastructure Audit — April 2, 2026

## The Confusion: Three Names, One Product

| What People Say | What They Mean | Reality |
| ---------------- | --------------- | --------- |
| "dwtb.com" | The website domain | **Does not exist.** Domain is `dwtb.dev` |
| "dwtb-marketplace" | The Next.js repo | GitHub repo → deployed on Vercel at dwtb.dev |
| "clawd-control-plane" | Deployment scripts repo | Stale manifests describing fictional Supabase architecture |
| "clawd-control-plane" | The Railway Python API | Real backend at `clawd-control-plane-production.up.railway.app` |

## Drift Inventory: What's Wrong and Where

### 1. `.env.example` (dwtb-marketplace) — STALE

| Problem | Detail |
| --------- | -------- |
| Lists Supabase vars as REQUIRED | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc. |
| Missing Railway vars | No `RAILWAY_API_URL`, no `RAILWAY_API_TOKEN` |
| Missing admin auth details | No `ADMIN_PASSWORD`, no `ADMIN_SECRET` |
| **Fix** | Delete. Replace with `.env.local.example` |

### 2. clawd-control-plane/README.md — WRONG ARCHITECTURE

| Claim | Reality |
| ------- | --------- |
| "dwtb-marketplace runs on Railway" | Runs on **Vercel** |
| "Supabase PostgreSQL with 6 tables" | Backend uses **JSONL files** on Railway volume |
| "Health: /api/time" | `/api/time` exists but isn't a health check |
| Architecture diagram shows Railway hosting | Vercel hosts the frontend |
| **Fix** | Archive repo. Absorb useful scripts into `dwtb-marketplace/infra/` |

### 3. clawd-control-plane/manifest/env.yaml — FICTIONAL

| Claim | Reality |
| ------- | --------- |
| 4 Supabase vars listed as "required: true" | App has zero Supabase code |
| No RAILWAY_API_URL | This is the ONLY required backend var |
| No RAILWAY_API_TOKEN | This is the ONLY required auth var |
| `NEXT_PUBLIC_VIDEO_URL` listed | Not used in current code |
| **Fix** | Do not port. Delete. |

### 4. clawd-control-plane/manifest/services.yaml — FICTIONAL

| Claim | Reality |
| ------- | --------- |
| `provider: railway` for dwtb-marketplace | Provider is **Vercel** |
| `supabase-postgres` service with 6 tables | No Supabase, no Postgres |
| `builder: nixpacks` | Vercel uses its own builder |
| `customDomain: dwtb.dev → Railway CNAME` | dwtb.dev points to Vercel |
| **Fix** | Do not port. Delete. |

### 5. clawd-control-plane/manifest/schema-digest.md — FICTIONAL

| Claim                                     | Reality                    |
| ----------------------------------------- | -------------------------- |
| Describes 6 Postgres tables with RLS      | Tables were never created  |
| **Fix**                                   | Do not port. Delete.       |

### 6. clawd-control-plane/scripts/setup-env.sh — WRONG VARS

| Claim | Reality |
| ------- | --------- |
| Prompts for Supabase vars | App doesn't use Supabase |
| Sets vars on Railway | Frontend env goes on Vercel |
| **Fix** | Do not port. |

### 7. clawd-control-plane/scripts/deploy.sh — WRONG TARGET

| Claim | Reality |
| ------- | --------- |
| Runs `railway up` to deploy frontend | Frontend deploys via Vercel git push |
| Checks for Supabase env vars | No Supabase |
| **Fix** | Do not port. Vercel deploys on git push. |

## What's Actually Correct

| Item | Status |
| ------ | -------- |
| `src/lib/clawd.ts` | Correct. Uses `RAILWAY_API_URL` + `RAILWAY_API_TOKEN`. All Railway endpoints mapped. |
| `src/app/api/*` route handlers | Correct architecture. BFF pattern calling Railway. |
| `vercel.json` | Correct. Security headers. |
| `next.config.ts` | Correct. |
| Email refs (`casey@dwtb.dev`, `bids@dwtb.dev`) | Correct. |
| `.github/copilot-instructions.md` | Correct. Just created with real architecture. |

## Unification Plan (Ordered)

1. **Delete `.env.example`** — stale Supabase refs
2. **Create `.env.local.example`** — correct Railway + admin vars
3. **Update `README.md`** — correct architecture, local dev setup
4. **Clean dwtb-marketplace of any remaining Supabase mentions** in docs/config
5. **Archive clawd-control-plane repo on GitHub** — mark as deprecated
6. **Optionally**: port `health-check.sh` into `infra/` with corrected endpoints
7. **Build + test** to confirm nothing broke

## Files Created by This Audit

| File | Purpose |
| ------ | --------- |
| `.github/copilot-instructions.md` | Workspace-level truth: real architecture, real env vars, coding conventions |
| `.github/agents/repo-unifier.agent.md` | Agent that executes the unification |
| `.github/instructions/env-guardrails.instructions.md` | Prevents Supabase vars from creeping back |
| `.github/instructions/clawd-client.instructions.md` | Rules for the Railway API client |
| `.github/prompts/purge-stale-refs.prompt.md` | Runnable prompt to find and kill all stale references |
| `INFRA-AUDIT.md` | This file — the gap analysis |
