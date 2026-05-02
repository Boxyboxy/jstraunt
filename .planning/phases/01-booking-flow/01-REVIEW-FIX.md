---
phase: 01-booking-flow
fixed_at: 2026-05-02T00:00:00Z
review_path: .planning/phases/01-booking-flow/01-REVIEW.md
iteration: 1
findings_in_scope: 12
fixed: 11
skipped: 1
status: partial
---

# Phase 1: Code Review Fix Report

**Fixed at:** 2026-05-02
**Source review:** `.planning/phases/01-booking-flow/01-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 12
- Fixed: 11
- Skipped: 1

## Fixed Issues

### CR-01: Wine opt-in defaults to 0 pairings, allowing nonsensical submission

**Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx`, `src/lib/validators.ts`
**Commit:** 726f315
**Applied fix:** When `SET_WINE_OPT_IN` is toggled on, the reducer now defaults `winePairingCount` to `state.pax` whenever the existing count is 0, preventing the controlled-select mismatch. Also added a Zod refine to `bookingSchema` requiring `winePairingCount >= 1` whenever `wineOptIn` is true (and added the `wineOptIn` field to the schema).

### CR-02: No per-step validation — invalid data reaches the server with a useless error

**Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx`, `src/app/(guest)/book/[eventId]/StepParty.tsx`, `src/app/(guest)/book/[eventId]/actions.ts`
**Commit:** f7108fd
**Applied fix:** Added `validateStep` and `validateAllSteps` helpers that check the relevant invariants per step (wine count >= 1 when opted in, guest names non-empty, contact name/email/phone non-empty + email regex). `handleNext` now runs `validateStep` before dispatching `NEXT_STEP`; `handleConfirm` runs `validateAllSteps`. Added a new `SET_FIELD_ERRORS` action so per-field messages are written into `state.errors`. `submitBooking` now flattens `parsed.error.flatten().fieldErrors` and remaps server keys (`guestName` → `name`, etc.) to UI keys; the client dispatches them as field errors instead of showing the catch-all banner.

### CR-03: `RESTORE` action accepts untrusted sessionStorage payload without runtime validation

**Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx`
**Commit:** 9ce757b
**Applied fix:** Added a `restoreSchema` (Zod) that partially validates the persisted shape (step union, pax, wineOptIn, winePairingCount, guestDetails). The mount effect now `safeParse`s the payload, removes corrupt storage, clamps `pax` to `seatsLeft` (handling capacity drops between sessions), resizes `guestDetails` to match, and clamps `winePairingCount` to the safe pax. Effect dep array updated to include `seatsLeft`.

### CR-04: `state.pax` can exceed `seatsLeft`, causing controlled-select desync

**Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx`
**Commit:** 399a2f3
**Applied fix:** Replaced module-scope `initialState` with a `buildInitialState(seatsLeft)` factory that clamps `pax` to `Math.max(1, Math.min(INITIAL_PAX, seatsLeft))` and sizes `guestDetails` accordingly. `useReducer` now uses the lazy-init form `useReducer(reducer, seatsLeft, buildInitialState)`.

### WR-01: `startTransition` wrapping an async function — should be `useTransition`

**Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx`
**Commit:** 6f958b9
**Applied fix:** Switched the import from the module-level `startTransition` to the `useTransition` hook. The double-submit guard in `handleConfirm` now reads `isPending` (always current) instead of the closure-captured `state.isSubmitting` (which lags by one render).

### WR-02: Phone field is required in UI but optional in validator

**Files modified:** `src/lib/validators.ts`, `src/app/(guest)/book/[eventId]/actions.ts`
**Commit:** 6307e68
**Applied fix:** `bookingSchema.guestPhone` is now `z.string().min(1, 'Phone number is required')`. Removed the `?? ''` fallback in `actions.ts` so the call to the RPC passes `parsed.data.guestPhone` directly.

### WR-03: `SET_GUEST_DETAIL` action's `value` type allows invalid severity strings

**Files modified:** `src/app/(guest)/book/[eventId]/StepParty.tsx`, `src/app/(guest)/book/[eventId]/StepDietary.tsx`
**Commit:** 3548230
**Applied fix:** Split the `SET_GUEST_DETAIL` action into three discriminated variants: `string` fields (guest_name, other_allergies, special_requests), `string[]` fields (allergies, dietary_restrictions), and the `severity` enum. Also tightened `SET_CONTACT.field` to the `'name' | 'email' | 'phone'` union. Added an `isSeverity` runtime guard in `StepDietary` so DOM-tampered values are rejected at the dispatch site rather than silently flowing through.

### WR-04: `GO_TO_STEP` lets user skip forward past unfilled steps

**Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx`, `src/app/(guest)/book/[eventId]/StepParty.tsx`
**Commit:** 6a18c11
**Applied fix:** Added `highestStep` to `FormState`. `NEXT_STEP` advances `highestStep` whenever the new step is greater. `GO_TO_STEP` now clamps the target to `Math.min(action.step, state.highestStep)`, so the user can only revisit steps they have actually reached. RESTORE also normalises `highestStep` to be at least the restored `step`.

### WR-05: Stale `seatsLeft` from ISR — UI shows seat count up to 60s out of date

**Files modified:** `src/app/(guest)/book/[eventId]/page.tsx`
**Commit:** 2e8c21c
**Applied fix:** Replaced `export const revalidate = 60` with `export const dynamic = 'force-dynamic'` and `export const revalidate = 0`. The booking page is now rendered on demand so `seatsLeft` is always fresh; the events listing remains cached separately.

### WR-06: `bookingId.slice(0, 8)` reference code is not unique enough

**Files modified:** `src/app/(guest)/book/[eventId]/BookingSuccess.tsx`
**Commit:** 558a0ca
**Applied fix:** Display the full UUID (uppercased) in the booking-confirmation panel. Added `break-all` and a smaller responsive font size to keep the long string readable in the existing pill.

### WR-08: `useEffect` dependency arrays disabled with eslint-disable

**Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx`
**Commit:** 8385404
**Applied fix:** Wrapped `SESSION_KEY` in `useMemo(() => \`booking:${event.id}\`, [event.id])` and added it to both effects' dependency arrays. Removed the `eslint-disable` comments. The restore effect now depends on `[seatsLeft, SESSION_KEY]` and the persist effect on `[state, SESSION_KEY]`.

## Skipped Issues

### WR-07: Booking RPC's email upsert silently overwrites existing guest names/phones

**File:** `supabase/migrations/003_functions.sql:48-53`
**Reason:** The reviewer explicitly notes this is "Out of scope for the front-end fix, but flag for the next phase." The fix would require either a documentation change to formalise the email-as-identity model or a schema migration to add a separate unique key — both belong to a future phase rather than the current booking-flow review-fix iteration.
**Original issue:** The `INSERT ... ON CONFLICT (email) DO UPDATE` pattern in `create_booking` overwrites existing `name`/`phone` for any subsequent booking sharing an email, which couples contact-email-as-identity to the booking form in an undocumented way.

---

_Fixed: 2026-05-02_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
