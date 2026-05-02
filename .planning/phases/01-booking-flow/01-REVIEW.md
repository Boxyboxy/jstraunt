---
phase: 01-booking-flow
reviewed: 2026-05-02T00:00:00Z
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
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 1: Code Review Report (Re-review after auto-fix)

**Reviewed:** 2026-05-02
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This is a re-review of the Phase 1 booking flow after the auto-fix pass applied 11 of 12 in-scope fixes (WR-07 was correctly skipped as out-of-scope — it requires a schema migration for the next phase).

**Verification of prior findings:**
- **CR-01 (wine opt-in submits zero pairings):** Fixed. `SET_WINE_OPT_IN` now defaults `winePairingCount` to `state.pax` when count is 0; `bookingSchema` has a refine enforcing `winePairingCount >= 1` whenever `wineOptIn` is true.
- **CR-02 (no per-step validation):** Fixed. `validateStep`/`validateAllSteps` gate `NEXT_STEP` and `Confirm`; server `submitBooking` now flattens Zod fieldErrors and the client renders per-field highlights via `SET_FIELD_ERRORS`.
- **CR-03 (untrusted sessionStorage RESTORE):** Fixed. `restoreSchema` (Zod, partial) validates the payload; pax is clamped to `seatsLeft` and `guestDetails` is resized; corrupt payloads are dropped.
- **CR-04 (pax > seatsLeft desync):** Fixed via `buildInitialState(seatsLeft)` lazy initializer.
- **WR-01 (`startTransition` over async):** Fixed; now uses `useTransition` and `isPending` is the authoritative double-submit guard.
- **WR-02 (phone optional in validator):** Fixed; `guestPhone` is now `.min(1)` required.
- **WR-03 (loose `SET_GUEST_DETAIL` value type):** Fixed via discriminated action union + `isSeverity` runtime guard.
- **WR-04 (`GO_TO_STEP` skips ahead):** Fixed via `highestStep` tracking and `Math.min(action.step, state.highestStep)` clamp.
- **WR-05 (stale ISR `seatsLeft`):** Fixed; `dynamic = 'force-dynamic'` + `revalidate = 0`.
- **WR-06 (8-char reference too short):** Fixed; full UUID is shown.
- **WR-08 (eslint-disable on effect deps):** Fixed via `useMemo` for `SESSION_KEY`.

The fixes are correct in substance. However, the auto-fix pass introduced or left unaddressed several smaller issues, listed below. None are blockers; the code is now production-shippable from a correctness standpoint.

## Warnings

### WR-01: `winePairingCount` is not clamped when restoring a payload that omits `pax`

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:251-265`

**Issue:** The restore effect only clamps `winePairingCount` inside the `if (safePax !== undefined)` block. If a sessionStorage payload contains a valid `winePairingCount` but no `pax` (legitimate or tampered), the count is restored unchecked and may exceed the current `state.pax` (which stays at the initial value). After restore, the StepParty `<Select>` has `value="<count>"` while options are `[1..pax]` — controlled-select desync.

The same applies to `pax` being absent: `data.pax === undefined` skips the `guestDetails` resize step too, so a payload with N guestDetails entries but no pax can leave `state.pax = INITIAL_PAX` while `state.guestDetails.length = N`. StepDietary then renders N cards but StepParty shows pax=2.

**Fix:** Clamp/resize unconditionally based on the resolved pax (restored value or current state):

```tsx
const resolvedPax = data.pax !== undefined
  ? Math.min(Math.max(1, data.pax), Math.max(1, seatsLeft))
  : state.pax  // not available here in effect; fall back to INITIAL_PAX or read via ref
const payload: Partial<FormState> = {
  ...data,
  pax: resolvedPax,
  guestDetails: resizeGuestDetails(data.guestDetails ?? [], resolvedPax),
  winePairingCount: Math.min(data.winePairingCount ?? 0, resolvedPax),
}
```

If implementing this requires reading current state from inside the mount effect (which captures initial state only), invariants can be enforced inside the reducer's `RESTORE` case instead — that has access to current state.

---

### WR-02: Server-side Zod field errors with nested paths are not surfaced per-field on the client

**File:** `src/app/(guest)/book/[eventId]/actions.ts:32-44`

**Issue:** `parsed.error.flatten().fieldErrors` returns errors only at the top level of the schema (e.g., `guestDetails`, `pax`, `eventId`). Errors on nested paths such as `guestDetails.0.guest_name` get collapsed under the parent key `guestDetails`, so the client cannot highlight the specific guest card. The mapping table `{ guestName, guestEmail, guestPhone }` only covers root-level keys; `guestDetails` is not mapped at all.

In practice the client `validateStep` runs first so this is a defense-in-depth path, but if a malicious client bypasses local validation, the server returns a confusing aggregated error with no field highlight (the user sees `Please correct the highlighted fields.` banner with nothing actually highlighted).

**Fix:** Use `parsed.error.format()` (or iterate `parsed.error.issues` to build dotted paths) so nested errors land in `guestDetails.0.guest_name` keys that match the existing `state.errors` shape:

```ts
const fieldErrors: Record<string, string> = {}
for (const issue of parsed.error.issues) {
  const path = issue.path.join('.')
  const uiKey = map[path] ?? path
  if (!fieldErrors[uiKey]) fieldErrors[uiKey] = issue.message
}
```

---

### WR-03: `bookingId: null` falls through to `SET_SUCCESS` without runtime validation

**File:** `src/app/(guest)/book/[eventId]/actions.ts:58-59`

**Issue:** `return { bookingId: data as string }`. The RPC should always return a UUID on success, but `data` is typed as `unknown` and the cast bypasses any check. If for any reason `data` is `null` or a non-string, `SET_SUCCESS` dispatches with `bookingId: null`, the success branch in BookingForm (`if (state.bookingId)`) is falsy, and the user sees the form re-render with no error and no confirmation — a silent dead end after a successful charge-equivalent action.

**Fix:** Validate `data` before returning:

```ts
if (typeof data !== 'string' || data.length === 0) {
  return { error: 'Booking succeeded but the server returned an invalid reference. Please contact support.' }
}
return { bookingId: data }
```

---

## Info

### IN-01: Persisted sessionStorage payload still includes `errors`/`isSubmitting`

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:286-289`

**Issue:** Only `contact` is excluded from `nonPii` — `errors`, `isSubmitting`, and `bookingId` (when null) are still serialized. They are correctly overridden in the RESTORE reducer case, so no functional impact, but transient validation errors are written to sessionStorage on every keystroke that fails validation. Storage payload is bloated and may briefly contain stale error text.

**Fix:** Exclude all transient fields explicitly:

```ts
const { contact, errors, isSubmitting, bookingId, ...persisted } = state
sessionStorage.setItem(SESSION_KEY, JSON.stringify(persisted))
```

---

### IN-02: `BookingSuccess` redundantly clears storage already cleared by the persist effect

**File:** `src/app/(guest)/book/[eventId]/BookingSuccess.tsx:17-19`

**Issue:** The persist effect in `BookingForm` (line 282-285) already calls `sessionStorage.removeItem(SESSION_KEY)` when `state.bookingId` is set. `BookingSuccess`'s mount effect then does the same removal again. Harmless, but the duplication suggests one of the two is dead code. The `BookingForm`-side removal is the right place (it owns the lifecycle); the `BookingSuccess`-side useEffect can be deleted.

**Fix:** Remove the useEffect from `BookingSuccess.tsx`, or rely on it solely and remove the corresponding branch from `BookingForm`'s persist effect.

---

### IN-03: `validators.ts` still has no max length on free-text fields

**File:** `src/lib/validators.ts:3-19`

**Issue:** Carryover from the previous IN-04. `guest_name`, `other_allergies`, `special_requests`, `guestName`, `guestEmail`, `guestPhone` have no `.max(N)` — a 100KB string for `special_requests` will be accepted and stored, bloating the database. The DB column types aren't visible here but typically TEXT has no implicit cap. Not a security blocker (the RPC is parameterised), but a denial-of-service / data-quality risk.

**Fix:** Add reasonable maxes that match the DB column constraints:

```ts
guest_name: z.string().min(1, 'Name is required').max(100),
other_allergies: z.string().max(500).optional(),
special_requests: z.string().max(1000).optional(),
guestEmail: z.string().email().max(254), // RFC 5321
guestPhone: z.string().min(1).max(32),
guestName: z.string().min(1).max(100),
```

---

### IN-04: `validators.ts` still has `pax.max(16)` while UI caps at 8

**File:** `src/lib/validators.ts:20`, `src/app/(guest)/book/[eventId]/StepParty.tsx:84`

**Issue:** Carryover from the previous IN-03. UI builds `paxOptions` from `Math.min(8, seatsLeft)` but `bookingSchema.pax` accepts up to 16. The mismatch is harmless today (RPC enforces the seat count), but the validator's max is not derived from any business rule visible in this codebase and creates ambiguity for future maintainers.

**Fix:** Define a shared constant `MAX_PAX_PER_BOOKING = 8` (or whatever the operational rule is), import it in both files, and use it in the validator's `.max()` and StepParty's `paxOptions` computation.

---

_Reviewed: 2026-05-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
