# dwtb-marketplace

DWTB?! Studios — Q2 2026 GTM Partner Marketplace. Next.js 16 frontend deployed on Vercel at [dwtb.dev](https://dwtb.dev).

## Architecture

```text
Browser → dwtb.dev (Vercel)
            ├─ Next.js App Router (pages)
            ├─ API Route Handlers (BFF)
            │     └─ clawd.ts → Railway API (clawd-control-plane)
            ├─ Resend (email — optional)
            └─ Upstash Redis (rate limiting — optional)
```

## Local Development

```bash
# 1. Copy env template
cp .env.local.example .env.local

# 2. Fill in RAILWAY_API_TOKEN (get from Railway dashboard or `railway vars` CLI)
#    Fill in ADMIN_PASSWORD and ADMIN_SECRET (min 16 chars)

# 3. Install and run
npm install
npm run dev

# 4. Verify Railway connectivity
#    Login to admin at http://localhost:3000/admin, then:
#    http://localhost:3000/api/health → should return { "status": "ok" }
```

## Scripts

| Command | Purpose |
| --------- | --------- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build (must pass before deploy) |
| `npm run test:run` | Run all tests |
| `npm run lint` | Lint check |

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 6
- **Styling**: Tailwind v4 (CSS `@theme`, not tailwind.config.js)
- **Testing**: Vitest + jsdom
- **Backend**: Railway API via `src/lib/clawd.ts`
- **Email**: Resend (optional)
- **Rate Limiting**: Upstash Redis (optional)
