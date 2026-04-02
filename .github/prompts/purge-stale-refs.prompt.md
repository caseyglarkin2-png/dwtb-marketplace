---
description: "Audit and fix all stale references across the repo. Removes Supabase ghosts, fixes .env files, updates docs to match reality. Run this after merging clawd-control-plane into dwtb-marketplace."
---

# Purge Stale References

Execute these steps in order:

## 1. Find all Supabase references
```
grep -ri "supabase" --include="*.ts" --include="*.tsx" --include="*.md" --include="*.yaml" --include="*.yml" --include="*.json" --include="*.env*" --include="*.sh" .
```

## 2. Remove or replace every hit
- Code imports → delete the import and any code using it
- Env vars → remove the variable
- Docs → rewrite to reference Railway API instead
- Config → remove the section

## 3. Find all "dwtb.com" references
```
grep -ri "dwtb\.com" .
```
Replace with `dwtb.dev` — there is no dwtb.com.

## 4. Find architecture mismatches
```
grep -ri "railway.*deploy\|deploy.*railway" --include="*.md" .
```
The frontend deploys to VERCEL. Only the Python backend is on Railway.

## 5. Verify `.env.local.example` exists with correct vars
Required: `RAILWAY_API_URL`, `RAILWAY_API_TOKEN`, `ADMIN_PASSWORD`, `ADMIN_SECRET`
Forbidden: anything with "SUPABASE" in the name

## 6. Delete `.env.example` if it still exists
It contains Supabase references. `.env.local.example` replaces it.

## 7. Build + test
```
npx next build && npm run test:run
```
