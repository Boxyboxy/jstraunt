# TESTING.md — Test Coverage & Quality Gaps

## Summary

No automated test suite exists. `CLAUDE.md` explicitly states: "No test suite is configured." All quality assurance is manual.

---

## What Could Be Unit Tested

### `src/lib/utils.ts` — Pure utility functions (easiest to test)
- `formatDate(dateString)` — parses ISO string, formats to "Friday, April 22, 2026"
- `formatShortDate(dateString)` — formats to "Apr 22, 2026"
- `formatTime(timeString)` — converts "14:30" → "2:30 PM"
- `formatCurrency(amount)` — SGD formatting with Intl.NumberFormat
- `slugify(text)` — lowercases and hyphenates text
- `getSeatsStatus(booked, total)` — returns 'available' | 'almost_full' | 'sold_out'
  - Edge cases: `booked === total` (sold out), `total - booked <= 3` (almost full), off-by-one

### `src/lib/validators.ts` — Zod schema validation
- `bookingSchema` has two cross-field refinements worth testing:
  - `guestDetails.length === pax` — must match party size
  - `winePairingCount <= pax` — can't exceed party size
- `bookingSchema` with edge cases: `pax=1`, `pax=16`, `winePairingCount=0`
- `eventSchema` slug regex: `/^[a-z0-9-]+$/`
- `venueSchema` URL validation: accepts empty string OR valid URL

---

## What Requires Integration Tests

### Booking flow (`src/app/api/` + `create_booking` DB function)
- Seat reservation atomicity — the `create_booking` Postgres function handles this, but it's only exercised through the full HTTP stack
- Concurrent booking race conditions — untestable without a real DB

### Admin server actions (`src/app/admin/**/actions.ts`)
- `createEvent` in `src/app/admin/events/actions.ts` — partial rollback on course insert failure (line 89–93): manually verifies the orphaned event is deleted
- `updateEvent` in `src/app/admin/events/actions.ts` — **non-atomic risk** (lines 121–136): deletes existing courses before inserting new ones; if insert fails, the event has no courses (data loss window)
- Auth guard `requireAuth()` — exercised only through manual admin login

---

## Areas Manually Tested Only

| Area | Risk |
|------|------|
| Auth flow (login, session refresh, middleware redirect) | High — any regression breaks all of admin |
| Booking submission form | High — primary revenue path |
| Admin CRUD (events, venues, bookings) | Medium — errors visible immediately in UI |
| Gallery / events public pages | Low — read-only SSR |
| Image upload via Supabase Storage | Medium — silent failure possible |
| Cron reminder emails | High — only runs on schedule, hard to spot breakage |

---

## Key Risks from Zero Test Coverage

1. **`updateEvent` data loss** (`src/app/admin/events/actions.ts:123`): delete-then-insert pattern means a failed insert leaves the event with no courses. No rollback possible without a DB transaction.

2. **`getSeatsStatus` off-by-one** (`src/lib/utils.ts:34`): boundary at `total - booked <= 3` — easy to regress with a sign flip.

3. **Zod cross-field refinements** (`src/lib/validators.ts:20–26`): `bookingSchema` has two refinements that could silently fail if `pax` type coercion changes upstream.

4. **No smoke tests for build**: `npm run build` is the only CI signal. A runtime crash in a server component won't surface until deployment.

5. **Cron route**: if the reminder email route breaks, no alert exists — bookings accumulate without reminders.

---

## Recommended Starting Points

If tests are ever added:
1. **Vitest** for unit tests (compatible with Next.js, zero config)
2. Unit test `src/lib/utils.ts` and `src/lib/validators.ts` first — pure functions, no mocks needed
3. Integration test `create_booking` DB function against local Supabase (`supabase start`)
4. E2E with Playwright for the booking flow and admin auth
