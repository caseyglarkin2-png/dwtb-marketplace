---
applyTo: "src/lib/clawd.ts"
description: "Railway API client guardrails. All backend communication goes through clawdFetch(). Never import Supabase. Never expose RAILWAY_API_TOKEN in logs or responses."
---

# Railway API Client (clawd.ts) Rules

- This is the ONLY file that talks to the Railway backend
- All functions use `clawdFetch()` which adds Bearer auth from `RAILWAY_API_TOKEN`
- NEVER log the full URL (contains the Railway domain — not a secret but unnecessary)
- NEVER log or expose `RAILWAY_API_TOKEN`
- NEVER import or reference Supabase
- Backend base URL: `process.env.RAILWAY_API_URL`
- Backend endpoints: see `.github/copilot-instructions.md` for the full list
