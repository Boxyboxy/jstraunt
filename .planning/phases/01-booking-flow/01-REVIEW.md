---
phase: 01-booking-flow
reviewed: 2026-05-03T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/app/(guest)/book/[eventId]/BookingForm.tsx
  - src/app/(guest)/book/[eventId]/BookingSuccess.tsx
  - src/app/(guest)/book/[eventId]/StepContact.tsx
  - src/app/(guest)/book/[eventId]/StepDietary.tsx
  - src/app/(guest)/book/[eventId]/StepIndicator.tsx
  - src/app/(guest)/book/[eventId]/StepParty.tsx
  - src/app/(guest)/book/[eventId]/StepReview.tsx
  - src/app/(guest)/book/[eventId]/actions.ts
  - src/app/(guest)/book/[eventId]/page.tsx
  - src/lib/validators.ts
findings:
  blocker: 0
  warning: 4
  total: 4
status: issues_found
---

# Phase 1: Code Review Report (Iteration 3)

**Reviewed:** 2026-05-03
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Iteration 3 re-review of the Phase 1 booking flow. The second-pass auto-fix (`654a3b0`, `de034f9`, `52daf51`) addressed all three iteration-2 warnings (WR-01..WR-03). All three fixes hold:

- **WR-01 (winePairingCount/guestDetails desync on partial restore):** Fixed in `BookingForm.tsx:255-269`. `resolvedPax` is computed up-front and used as the cap for both `guestDetails` resize and `winePairingCount` clamp regardless of which keys are present in the restored payload. The `guestDetails` resize still gates on `data.guestDetails !== undefined || data.pax !== undefined`, which is correct: omitting both means the initial `state.guestDetails` (length === `initialPax === resolvedPax`) is already consistent.
- **WR-02 (nested Zod field errors collapsed):** Fixed in `actions.ts:35-48`. The action now iterates `parsed.error.issues` and joins `issue.path` with `.`, producing keys like `guestDetails.0.guest_name` that match the client's `state.errors` shape and surface per-card highlights.
- **WR-03 (silent dead end on non-string RPC result):** Fixed in `actions.ts:68-73`. A non-string or empty `data` now returns an explicit support-contact error, preserving a recoverable user path.

The four issues below are either unaddressed carryovers from the prior pass (IN-03/IN-04 were left explicitly out of the second fix pass) or fresh items surfaced this round. None are blockers; the code is shippable from a correctness standpoint.

## Warnings

### WR-01: `submitBooking` swallows underlying RPC/Supabase errors with no logging

**File:** `src/app/(guest)/book/[eventId]/actions.ts:6-20, 62`

**Issue:** `mapRpcError` translates known RPC exception substrings to user-friendly text and falls back to a generic `'Something went wrong. Please try again.'` for everything else. The original `error.message` (and any postgres error code, hint, details) is never logged. When the RPC fails for an unforeseen reason — RLS regression, trigger error, connection blip, schema drift — the user sees a generic message and ops has no audit trail to diagnose. Worse, for the `bookingId` validation path on lines 68-73, a successful seat reservation followed by an invalid return value also surfaces a generic "contact support" message with no server-side record of which booking actually got created.

This is the entrypoint for the highest-stakes mutation in the app (it decrements seats and writes a booking row). Silent failure here is materially harder to debug than in any other action.

**Fix:** Log unmapped errors at the action boundary so they reach the platform's log sink:

```ts
if (error) {
  // Log the raw error so ops can correlate user reports with server failures.
  console.error('[submitBooking] RPC failed', {
    eventId: parsed.data.eventId,
    code: error.code,
    message: error.message,
    details: error.details,
  })
  return { error: mapRpcError(error.message) }
}
if (typeof data !== 'string' || data.length === 0) {
  console.error('[submitBooking] RPC returned non-uuid', {
    eventId: parsed.data.eventId,
    data,
  })
  return { error: '...contact support.' }
}
```

Avoid logging PII (`guestEmail`, `guestPhone`, `guestName`) — eventId + error metadata is sufficient for triage.

---

### WR-02: Server does not cross-validate `wineOptIn` / `winePairingCount` against the event's `wine_pairing` flag

**File:** `src/app/(guest)/book/[eventId]/actions.ts:51-60`, `src/lib/validators.ts:21-34`, `supabase/migrations/003_functions.sql:56-57`

**Issue:** When `event.wine_pairing = false` (and therefore `event.wine_price` is null), `StepParty` correctly hides the wine-pairing toggle, so a normal user can never set `wineOptIn=true`. But `bookingSchema` only validates the *internal consistency* of `wineOptIn` and `winePairingCount`; nothing in the server-action layer or the schema cross-checks these against the event row. A scripted POST with `wineOptIn: true, winePairingCount: 8` for an event whose `wine_pairing` is false is accepted by Zod, passed to `create_booking`, and stored: `bookings.wine_pairing_count = 8`. The price calculation `p_wine_pairing_count * COALESCE(v_event.wine_price, 0)` evaluates to 0, so the user is not over-charged — but the booking row carries 8 wine pairings the kitchen will see and prep, with no revenue line. This is a data-integrity / operational bug, not a financial one.

Two reasonable fixes; either is sufficient:

- **Server action level:** before invoking the RPC, fetch `event.wine_pairing` and reject the payload if `winePairingCount > 0` while wine pairing is disabled.
- **Database level:** add a check in `create_booking` that raises if `p_wine_pairing_count > 0 AND v_event.wine_pairing = false`. (Phase 2 territory if the migration is out of scope here.)

The action-level fix is contained to this file:

```ts
const { data: event } = await supabase
  .from('events')
  .select('wine_pairing')
  .eq('id', parsed.data.eventId)
  .single()
if (event && !event.wine_pairing && parsed.data.winePairingCount > 0) {
  return {
    error: 'Wine pairings are not available for this event.',
    fieldErrors: { winePairingCount: 'Not available' },
  }
}
```

---

### WR-03: `validators.ts` has no `.max()` on free-text fields (carryover from IN-03)

**File:** `src/lib/validators.ts:3-19`

**Issue:** Carryover from iteration 2 (IN-03), unaddressed. `guest_name`, `other_allergies`, `special_requests`, `guestName`, `guestEmail`, `guestPhone` accept arbitrarily long strings. `pax` is capped at 16 and `guestDetails` length must equal `pax`, so the worst-case payload is bounded by `16 * (name + other_allergies + special_requests)`. With no per-field cap a single submit can be megabytes — Supabase will accept it, the JSONB column will store it, and the kitchen-facing UI will need to render it. This is a denial-of-service / data-quality risk rather than a security breach (the RPC is parameterised), but it's also a one-line fix.

This was demoted to **Warning** (from prior **Info**) because the field is reachable by an unauthenticated POST through the server action — anyone with the URL can spam-fill the table.

**Fix:** Add caps that match the realistic field semantics:

```ts
guest_name: z.string().min(1, 'Name is required').max(100),
other_allergies: z.string().max(500).optional(),
special_requests: z.string().max(1000).optional(),
// In bookingSchema:
guestName: z.string().min(1).max(100),
guestEmail: z.string().email().max(254), // RFC 5321 local+domain max
guestPhone: z.string().min(1, 'Phone number is required').max(32),
```

Also consider mirroring the limits in the StepContact / StepDietary inputs as `maxLength` so the browser stops the user before the request goes out.

---

### WR-04: `validators.ts` `pax.max(16)` is inconsistent with the UI cap of 8 (carryover from IN-04)

**File:** `src/lib/validators.ts:20`, `src/app/(guest)/book/[eventId]/StepParty.tsx:84`

**Issue:** Carryover from iteration 2 (IN-04), unaddressed. `StepParty.tsx:84` builds `paxOptions` from `Math.max(1, Math.min(8, seatsLeft))` — the UI never lets a user pick more than 8 — but `bookingSchema.pax` accepts up to 16. The mismatch is harmless in normal operation because:

1. The UI gates at 8.
2. The RPC's `(v_event.booked_seats + p_pax) > v_event.total_seats` check enforces the seat budget.
3. `bookings.pax` and the per-event seat budget are bounded by `events.total_seats` (validated to `<= 30` in `eventSchema`).

But the `8` is a load-bearing business rule (party size limit) that lives only in the JSX and is silently overridden by anyone who bypasses the client. A scripted POST with `pax: 12` for a 20-seat event is accepted by the schema, the RPC, and the DB. Two outcomes are possible: the table is too small for the party, or `guestDetails.length` (capped to 16 by `bookingSchema.guestDetails.length === pax`) overruns the kitchen's expectation of single-fieldset-per-guest.

**Fix:** Define `MAX_PAX_PER_BOOKING = 8` (or whatever the operational rule is) in a shared constants module and use it in both `bookingSchema.pax.max(...)` and `StepParty`'s `paxOptions` computation:

```ts
// src/lib/constants.ts
export const MAX_PAX_PER_BOOKING = 8

// validators.ts
pax: z.number().int().min(1).max(MAX_PAX_PER_BOOKING),

// StepParty.tsx
const maxPax = Math.max(1, Math.min(MAX_PAX_PER_BOOKING, seatsLeft))
```

---

_Reviewed: 2026-05-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
