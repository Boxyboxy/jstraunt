# ARCHITECTURE.md — System Architecture

## Overview

Palette is a Next.js App Router application with a clean SSR/CSR split. Public guest-facing pages are Server Components for SEO and fast loads; the admin dashboard is client-side rendered behind auth. Supabase handles persistence, auth, and file storage.

---

## Route Architecture

```
/                     → (guest) route group — SSR, public
/events               → (guest) SSR
/events/[slug]        → (guest) SSR
/gallery              → (guest) SSR
/book/[id]            → MISSING — linked from event detail page but doesn't exist
/admin/*              → Admin route group — auth-guarded, CSR forms
/auth/login           → Login page
/auth/callback        → OAuth code exchange
/api/*                → Minimal API routes
```

The `(guest)` route group has its own `layout.tsx` (navigation, footer). Admin has its own `layout.tsx` (Sidebar + auth check). No shared layout between guest and admin.

---

## SSR / CSR Split

| Layer | Rendering | Auth | Purpose |
|-------|-----------|------|---------|
| `src/app/(guest)/` | Server Components (SSR) | None (public) | SEO-optimized public pages |
| `src/app/admin/` | Client Components (CSR forms) | Required | Admin CRUD dashboard |
| `src/app/auth/` | Mixed | None initially | Login UI + callback |
| `src/app/api/` | Edge/Node handlers | Varies | Booking submission, cron |

Server Components fetch directly from Supabase using the server client (anon key + RLS). Client forms submit through Next.js Server Actions which use the admin client (service-role key, bypasses RLS).

---

## Data Flow

### Guest (read path)
```
Browser → Next.js Server Component
        → createClient() (anon key + RLS)
        → Supabase Postgres (RLS filters rows)
        → Rendered HTML streamed to browser
```

### Booking submission (write path)
```
Browser form → /api/bookings (or server action)
             → bookingSchema.safeParse() validation
             → supabase.rpc('create_booking', ...) 
             → Postgres function (SECURITY DEFINER, atomic)
             → Returns booking_id
```
The `create_booking` function uses `FOR UPDATE` row lock to prevent concurrent overbooking.

### Admin mutation path
```
Admin form → Server Action ('use server')
           → requireAuth() — throws if no session
           → eventSchema / venueSchema validation (Zod)
           → createAdminClient() (service-role, bypasses RLS)
           → Supabase mutation
           → revalidatePath() → redirect()
```

---

## Auth Flow

```
Every request → middleware.ts → updateSession()
                              → supabase.auth.getUser()
                              → if /admin/* and no user → redirect /auth/login

Login form → /auth/login
           → Supabase email/password auth
           → Supabase redirects to /auth/callback?code=...
           → /auth/callback exchanges code for session
           → redirect to /admin (or ?next= param — OPEN REDIRECT RISK)

Server actions → requireAuth() → supabase.auth.getUser()
                               → throws Error('Unauthorized') if no user
Admin layout → also double-checks auth and redirect()'s
```

Double auth check: middleware protects at edge, admin layout checks again on server, `requireAuth()` checks a third time in actions. Belt-and-suspenders approach.

---

## Supabase Client Architecture

Two client factories, never mixed up:

| Client | File | Key | RLS | Used for |
|--------|------|-----|-----|---------|
| Server client | `src/lib/supabase/server.ts` | ANON | Enforced | Guest reads, auth |
| Admin client | `src/lib/supabase/admin.ts` | SERVICE_ROLE | Bypassed | Admin mutations |
| Browser client | `src/lib/supabase/client.ts` | ANON | Enforced | Client-side auth state |
| Middleware client | `src/lib/supabase/middleware.ts` | ANON | N/A | Session refresh only |

---

## Component Architecture

```
Server Components (default)
  ├── Page-level data fetching
  ├── Pass data as props to child components
  └── Render static HTML

Client Components ('use client')
  ├── EventForm.tsx — complex form with MenuBuilder
  ├── MenuBuilder.tsx — dynamic course CRUD
  ├── VenueForm.tsx — form + image upload
  ├── ReviewForm.tsx — review CRUD
  ├── DeleteButton.tsx — confirms before server action
  ├── StatusSwitcher.tsx — dropdown status change
  ├── GalleryGrid.tsx — client-side filter/masonry
  └── MobileHeader.tsx — hamburger menu state
```

No global state management. No Redux/Zustand. Form state is local (`useState`). Data is always re-fetched server-side after mutations via `revalidatePath()`.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No ORM | Supabase JS client is typed via `database.ts` auto-gen; ORM adds no value when types come from DB introspection |
| Server Actions for mutations | Colocated with forms, no API boilerplate, CSRF protected by Next.js |
| Service-role client only in server actions | Ensures mutations never happen from client-side code |
| `create_booking` as DB function | Atomicity — seat decrement + booking creation in one transaction with row lock |
| RLS for guest reads | Defense in depth — data filtered at DB level even if a query bug leaks |
| `revalidatePath()` + `redirect()` pattern | Bust ISR cache immediately after mutation, then redirect to prevent double-submit |
