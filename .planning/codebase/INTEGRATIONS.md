# External Integrations

**Analysis Date:** 2026-04-22

## APIs & External Services

**Database & Backend (Supabase):**
- Supabase — primary backend: PostgreSQL database, auth, and file storage
  - SDK: `@supabase/supabase-js ^2.101.1`, `@supabase/ssr ^0.10.0`
  - Project URL env var: `NEXT_PUBLIC_SUPABASE_URL`
  - Two client modes:
    - Anon client (RLS-enforced): `src/lib/supabase/server.ts` — uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - Admin client (bypasses RLS): `src/lib/supabase/admin.ts` — uses `SUPABASE_SERVICE_ROLE_KEY`
    - Middleware client: `src/lib/supabase/middleware.ts` — session refresh on every request

**Email:**
- Resend — transactional email
  - SDK: `resend ^6.10.0`
  - Present in `package.json` dependencies; not yet wired into application source code
  - Planned for booking confirmations and event reminders (referenced in `src/app/admin/settings/page.tsx`)
  - Settings page also mentions Twilio (SMS) as a planned integration — not installed

**Fonts:**
- Google Fonts — loaded via `next/font/google` at build time in `src/app/layout.tsx`
  - Geist Sans, Geist Mono, Oswald
  - No runtime network requests; fonts are self-hosted by Next.js after initial download

## Data Storage

**Database:**
- Supabase PostgreSQL
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` (project URL)
  - Auth: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (guest reads via RLS) / `SUPABASE_SERVICE_ROLE_KEY` (admin mutations)
  - No ORM — raw Supabase JS client queries throughout
  - Schema migrations: `supabase/migrations/001_initial_schema.sql` through `004_cancel_booking_and_fixes.sql`
  - Key DB function: `create_booking` (`supabase/migrations/003_functions.sql`) — atomic seat reservation

**File Storage:**
- Supabase Storage — two buckets:
  - `venue-photos` — venue images
  - `dish-photos` — dish/menu images
  - Upload/delete helpers: `src/lib/storage.ts`
  - Public URLs served from `*.supabase.co/storage/v1/object/public/**`
  - Remote image pattern whitelisted in `next.config.ts`

**Caching:**
- None (no Redis or in-memory cache configured)
- Next.js built-in fetch/route caching applies; `revalidatePath()` used after mutations

## Authentication & Identity

**Auth Provider:** Supabase Auth (email/password)
- Login page: `src/app/auth/login/`
- OAuth callback handler: `src/app/auth/callback/route.ts` — exchanges code for session, redirects to `/admin`
- Session management: `src/lib/supabase/middleware.ts` via `updateSession()` — refreshes session cookie on every request
- Route guard: `middleware.ts` — redirects unauthenticated requests to `/admin/*` → `/auth/login`
- Server-action guard: `src/lib/auth.ts` — `requireAuth()` verifies session before any admin mutation

**Authorization:** Supabase RLS policies (`supabase/migrations/002_rls_policies.sql`) govern guest-side read access. Admin write operations use the service-role client after `requireAuth()`.

## Monitoring & Observability

**Error Tracking:** Not detected

**Analytics:** Not detected

**Logs:** `console.error` / standard Next.js server logs only

## CI/CD & Deployment

**Hosting:** Vercel
- Config: `vercel.json`

**CI Pipeline:** Not detected (no GitHub Actions or similar configured)

## API Routes

**Implemented:**
- `GET /auth/callback` (`src/app/auth/callback/route.ts`) — Supabase OAuth code exchange; redirects to `/admin` on success

**Configured but not yet implemented:**
- `GET /api/cron/reminders` — Vercel cron job, scheduled daily at 10:00 UTC (`"schedule": "0 10 * * *"` in `vercel.json`). Route handler file does not exist in source. Intended for booking reminder emails.

## Cron Jobs / Scheduled Tasks

| Path | Schedule | Status |
|------|----------|--------|
| `/api/cron/reminders` | `0 10 * * *` (daily 10:00 UTC) | Configured in `vercel.json`, not yet implemented |

## Environment Variables

**Required (referenced in source):**

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser + server) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser + server) | Supabase anon key for RLS-guarded reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Supabase service role key for admin mutations (bypasses RLS) |

**Anticipated (Resend not yet wired):**
- A Resend API key will be required when email sending is implemented

**Secrets location:** Environment variables only; no `.env.example` or secret directory detected in repo.

## Webhooks & Callbacks

**Incoming:**
- `/auth/callback` — Supabase auth redirect (OAuth PKCE code exchange)

**Outgoing:**
- None currently implemented

---

*Integration audit: 2026-04-22*
