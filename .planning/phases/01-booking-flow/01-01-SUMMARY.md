---
phase: 01-booking-flow
plan: 01
subsystem: api
tags: [next.js, supabase, server-actions, isr, zod, rpc]

# Dependency graph
requires:
  - phase: 00-foundation
    provides: "Supabase server client, bookingSchema validator, create_booking RPC, events table"
provides:
  - "submitBooking server action — anon Supabase RPC call with Zod validation and friendly error mapping"
  - "/book/[eventId] ISR page — fetches event, guards sold-out, renders placeholder for BookingForm"
  - "mapRpcError helper — translates PostgreSQL RAISE EXCEPTION strings to user copy"
affects:
  - 01-02-plan
  - 01-03-plan
  - 01-04-plan

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-action-with-anon-client (no requireAuth) for SECURITY DEFINER RPC calls"
    - "ISR (60s) page wrapper that passes server-fetched event prop to client form"
    - "RPC error mapping helper to avoid leaking PostgreSQL internals to the browser"

key-files:
  created:
    - "src/app/(guest)/book/[eventId]/actions.ts"
    - "src/app/(guest)/book/[eventId]/page.tsx"
  modified: []

key-decisions:
  - "Booking server action uses anon client (createClient), not service-role; the RPC is SECURITY DEFINER and RLS allows public INSERT"
  - "No revalidatePath/redirect in submitBooking — client renders success state directly to preserve bookingId"
  - "Page filters event status to ['published','sold_out'] only; 'completed' events do not accept bookings"
  - "Sold-out check guards on either status='sold_out' or seatsLeft===0 (defense in depth)"

patterns-established:
  - "Guest-facing server actions skip requireAuth() and use the anon Supabase client for SECURITY DEFINER RPC calls"
  - "ISR pages await params (Next.js 15+) and use single<Row>() for type-safe Supabase reads"
  - "PGRST116 is the only Supabase 'no rows' error — anything else rethrows for the error boundary"

requirements-completed: [BOOK-05, BOOK-06]

# Metrics
duration: 2min
completed: 2026-05-02
---

# Phase 01 Plan 01: Server Action and ISR Page Summary

**Guest booking infrastructure: ISR /book/[eventId] page with sold-out guard plus submitBooking server action calling the create_booking RPC via the anon Supabase client with Zod validation and friendly error mapping.**

## Performance

- **Duration:** ~2 min (118s)
- **Started:** 2026-05-02T02:13:36Z
- **Completed:** 2026-05-02T02:15:34Z
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments
- `submitBooking` server action implemented with `bookingSchema.safeParse` validation and `create_booking` RPC invocation
- `/book/[eventId]` page added with 60-second ISR, awaited params, PGRST116 handling, and inline sold-out state
- `mapRpcError` helper translates known PostgreSQL exception strings ("Not enough seats available", "not accepting bookings", "Booking deadline has passed") to user-friendly copy
- Routes register cleanly: `next build` reports `ƒ /book/[eventId]` alongside existing routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create server action (actions.ts)** — `37e1ed5` (feat)
2. **Task 2: Create page server component (page.tsx)** — `4ce86a6` (feat)

**Plan metadata:** pending (final docs commit)

## Files Created/Modified

- `src/app/(guest)/book/[eventId]/actions.ts` — `'use server'`; exports `submitBooking(payload: unknown): Promise<{ bookingId: string } | { error: string }>`; uses anon `createClient()`; defines local `mapRpcError`
- `src/app/(guest)/book/[eventId]/page.tsx` — Server component with `export const revalidate = 60`; awaits `params` Promise; fetches event with `.in('status', ['published','sold_out'])`; renders inline sold-out block or placeholder div pending BookingForm

## Decisions Made
- Followed plan as specified, with two minor deviations (see below) that were necessary for the build to pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused `getSeatsStatus` import and explicitly typed `.single<Event>()`**
- **Found during:** Task 2 (Create page.tsx)
- **Issue:** The plan template's `Full file structure` block imported `getSeatsStatus` from `@/lib/utils` and declared `type Event = Database['public']['Tables']['events']['Row']` but used neither — these would trigger TypeScript/lint `no-unused-vars` errors and fail the verification command.
- **Fix:** Omitted the unused `getSeatsStatus` import; kept the `Event` type alias and made it load-bearing by typing the Supabase result via `.single<Event>()`, which improves type safety on the `event` row.
- **Files modified:** `src/app/(guest)/book/[eventId]/page.tsx`
- **Verification:** `npm run build` exits 0; `npm run lint` reports 0 errors for the new file
- **Committed in:** `4ce86a6` (Task 2 commit)

**2. [Rule 3 - Blocking] Replaced `<a href="/events">` with `<Link href="/events">` in sold-out state**
- **Found during:** Task 2 (Create page.tsx) — caught by `npm run lint`
- **Issue:** The plan-supplied sold-out markup used a bare `<a>` element pointing to an internal `/events` route. The Next.js ESLint rule `@next/next/no-html-link-for-pages` rejects this with an error (not a warning), failing `npm run lint`.
- **Fix:** Imported `Link` from `next/link` and swapped the `<a>` for `<Link>`. Visual styling (className) is preserved verbatim.
- **Files modified:** `src/app/(guest)/book/[eventId]/page.tsx`
- **Verification:** `npm run lint` now reports 0 errors (only 5 pre-existing warnings in unrelated files, out of scope)
- **Committed in:** `4ce86a6` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking lint/TS errors)
**Impact on plan:** Both fixes were necessary for `npm run build && npm run lint` to pass. Behavior is identical to the plan's intent. No scope creep.

## Issues Encountered
- None beyond the deviations documented above. The five pre-existing lint warnings in `src/app/admin/dishes/page.tsx`, `src/app/admin/events/[id]/page.tsx`, `src/app/admin/guests/page.tsx`, `src/components/ui/ImageUpload.tsx`, and `src/lib/supabase/middleware.ts` are out of scope for this plan and were left untouched.

## User Setup Required

None — no external service configuration required. The booking action calls an existing `create_booking` RPC with the existing anon Supabase keys.

## Next Phase Readiness
- `actions.ts` is ready to be imported by `BookingForm.tsx` in Plan 04 via `import { submitBooking } from './actions'`
- `page.tsx` placeholder is wired to render `<BookingForm event={event} seatsLeft={seatsLeft} />` once Plan 04 creates the client component (the import line is already commented in place at line 5)
- No blockers for Plans 01-02, 01-03, or 01-04

## Threat Flags

None — all surface area introduced is already enumerated in the plan's `<threat_model>` (T-01-01 through T-01-05). The mitigations specified in the threat register are present:
- **T-01-01 (Tampering — payload):** `bookingSchema.safeParse` runs before any Supabase call; failure short-circuits to `{ error: 'Invalid booking data' }` without touching the DB
- **T-01-03 (Information Disclosure — RPC errors):** `mapRpcError` translates all three known exception strings to user copy and falls through to a generic message; `error.message` is never returned verbatim

## Self-Check: PASSED

- FOUND: `src/app/(guest)/book/[eventId]/actions.ts`
- FOUND: `src/app/(guest)/book/[eventId]/page.tsx`
- FOUND commit: `37e1ed5` (feat: submitBooking server action)
- FOUND commit: `4ce86a6` (feat: ISR booking page)

---
*Phase: 01-booking-flow*
*Completed: 2026-05-02*
