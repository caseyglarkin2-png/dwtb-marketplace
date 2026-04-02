---
name: repo-unifier
description: "Unify dwtb-marketplace and clawd-control-plane into a single repo. Use when: merging repos, fixing stale references, reconciling architecture, cleaning up Supabase ghosts, fixing .env files, updating deployment manifests."
tools:
  - run_in_terminal
  - read_file
  - create_file
  - replace_string_in_file
  - multi_replace_string_in_file
  - grep_search
  - file_search
  - list_dir
  - semantic_search
---

# Repo Unifier Agent

You are unifying two repos into one. Read this entire file before taking any action.

## Situation

**dwtb-marketplace** (GitHub: caseyglarkin2-png/dwtb-marketplace) is the only repo that matters.
It contains all application code — Next.js frontend + API route handlers.
It is deployed on **Vercel** at **dwtb.dev**.

**clawd-control-plane** (the repo in /workspaces/clawd-control-plane) is a deployment-scripts-only repo that:
- Has ZERO application code
- Contains stale manifests describing an architecture that was never built (Supabase, Railway hosting)
- Has deployment scripts that reference Supabase env vars the app doesn't use
- Has a README with a completely wrong architecture diagram

The REAL clawd-control-plane is a **Python API running on Railway** at `clawd-control-plane-production.up.railway.app`. This agent has no access to that codebase — it's a separate Railway service. We only interact with it via HTTP through `src/lib/clawd.ts`.

## What "Unify" Means

The clawd-control-plane repo should be **absorbed into dwtb-marketplace** as an `infra/` folder, then the separate repo archived. Specifically:

### Phase 1: Clean dwtb-marketplace (this repo)

1. **Delete `.env.example`** — it references Supabase. Replace with `.env.local.example` that has the REAL env vars (see copilot-instructions.md).
2. **Grep for ALL Supabase references** in `src/`, config files, docs. Remove every one. There should be zero mentions of Supabase in this repo.
3. **Verify `.gitignore`** includes `.env.local` (it should).
4. **Update `README.md`** with correct architecture, actual env vars, and local dev setup.

### Phase 2: Absorb useful scripts from clawd-control-plane

1. **Create `infra/` folder** in dwtb-marketplace root.
2. **Port deployment scripts** from clawd-control-plane into `infra/`:
   - `infra/health-check.sh` — keep but fix: remove Supabase checks, point at correct endpoints
   - `infra/deploy-railway.sh` — NOT NEEDED (Railway deploys from its own repo, not this one). Skip.
   - `infra/setup-env.sh` — rewrite for Vercel env vars, not Railway vars. Or just delete and document in README.
3. **Create `infra/architecture.md`** — the REAL architecture diagram (from copilot-instructions.md)
4. **Do NOT copy `manifest/env.yaml`** — it's wrong. The copilot-instructions.md env table is the source of truth.
5. **Do NOT copy `manifest/services.yaml`** — it describes fictional Supabase tables.
6. **Do NOT copy `manifest/schema-digest.md`** — Supabase schema that doesn't exist.

### Phase 3: Create the correct `.env.local.example`

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

### Phase 4: Update sprint plan docs

- Remove any references to "clawd-control-plane repo" as a separate entity
- Update PAYMENT-ARCHITECTURE.md if it references Supabase
- Update any sprint docs that reference the old architecture

### Phase 5: Verify

- `npx next build` passes
- `npm run test:run` passes
- Zero grep hits for `SUPABASE`, `supabase`, `supabase.co` in `src/`
- `.env.example` is gone, `.env.local.example` exists with correct vars
- README reflects actual architecture

## Rules

- NEVER add Supabase code, imports, or references
- NEVER describe dwtb-marketplace as running on Railway — it runs on Vercel
- The Railway backend (Python API) is a BLACK BOX to this repo. We call it via HTTP, we don't deploy it.
- `dwtb.dev` is the only domain. There is no `dwtb.com`.
- The clawd-control-plane repo will be archived on GitHub after unification. Do not preserve it as a submodule.
