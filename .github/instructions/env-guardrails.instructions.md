---
applyTo: "**/.env*,**/env.yaml,**/services.yaml"
description: "Environment variable and infrastructure file guardrails. Prevents Supabase references. Enforces correct Railway API vars."
---

# Environment & Infrastructure File Rules

## NEVER include these variables — Supabase does not exist:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## ALWAYS include these for Railway backend connectivity:
- RAILWAY_API_URL (required)
- RAILWAY_API_TOKEN (required)

## Deployment facts:
- Frontend (dwtb-marketplace) deploys to **Vercel**, NOT Railway
- Backend (clawd-control-plane) is a separate Python API on Railway
- Data storage is JSONL on Railway volume, NOT Postgres
- Domain is dwtb.dev, NOT dwtb.com
