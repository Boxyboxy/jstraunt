# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Development server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint 9
```

No test suite is configured.

For Supabase local dev:
```bash
supabase start    # Local Postgres + API
supabase db push  # Apply migrations
```

## Architecture

**Palette** is a private dining booking platform (Singapore, SGD) built on Next.js + Supabase.

### Route Layout

- `src/app/(guest)/` — Public SSR pages (homepage, events, gallery, booking flow). Server components by default for SEO.
- `src/app/admin/` — Protected CSR admin dashboard. Guarded by middleware + `requireAuth()`.
- `src/app/auth/` — Login page + Supabase OAuth callback.
- `src/app/api/` — Minimal API routes (booking submission, cron reminders, future webhooks).

### Data Layer

No ORM. All DB access via Supabase JS client. Two client factories:
- `src/lib/supabase/server.ts` — Server-side client (read operations, uses anon key + RLS)
- `src/lib/supabase/admin.ts` — Service-role client (mutations, bypasses RLS). Used only in server actions behind `requireAuth()`.

**Authorization strategy:** Supabase RLS policies (`supabase/migrations/002_rls_policies.sql`) handle guest-side access. Admin mutations go through the service-role client after `requireAuth()` verifies the session.

Schema migrations live in `supabase/migrations/`. The `create_booking` database function (`003_functions.sql`) is the booking submission entrypoint — it handles seat reservation atomically.

### Server Actions

Admin forms use Next.js server actions (`'use server'`) in colocated `actions.ts` files. Pattern:
1. Call `requireAuth()` — throws/redirects if unauthenticated
2. Validate input with Zod (`src/lib/validators.ts`)
3. Mutate via `createAdminClient()`
4. Call `revalidatePath()` to bust cache, then `redirect()`

### Auth

Supabase email/password. Middleware (`middleware.ts`) refreshes sessions on every request and redirects unauthenticated users away from `/admin/*`. The `requireAuth()` helper in `src/lib/auth.ts` is the server-action-level guard.

### Styling

Tailwind CSS v4 (PostCSS). Brand palette defined as CSS variables in `src/app/globals.css`:
- **Burgundy** — primary actions, admin sidebar
- **Gold** — highlights, warnings
- **Sage** — success, availability
- **Cream** — backgrounds, cards

Fonts: Oswald (headings), Geist Sans (body). No component library — custom UI atoms in `src/components/ui/`.

### Key Utilities

- `src/lib/utils.ts` — date/time formatting, currency (SGD), slugify, seat status helpers
- `src/lib/storage.ts` — Supabase Storage upload/delete for venue and dish photos
- `src/types/database.ts` — Auto-generated Supabase DB types (regenerate with `supabase gen types typescript`)


## Code Quality
- Prefer correct, complete implementations over minimal ones.
- Use appropriate data structures and algorithms — don't brute-force what has a known better solution.
- When fixing a bug, fix the root cause, not the symptom.
- If something I asked for requires error handling or validation to work reliably, include it without asking.