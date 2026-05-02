---
phase: 01-booking-flow
plan: 04
subsystem: ui
tags: [next.js, react, client-component, useReducer, startTransition, sessionStorage, server-actions]

# Dependency graph
requires:
  - phase: 00-foundation
    provides: "Database type for Event row, Next.js App Router conventions"
  - phase: 01-booking-flow
    plan: 01
    provides: "submitBooking server action; /book/[eventId] ISR page placeholder waiting for BookingForm"
  - phase: 01-booking-flow
    plan: 02
    provides: "StepIndicator, StepParty, StepDietary; canonical FormState/BookingAction/GuestDetail types in StepParty.tsx"
  - phase: 01-booking-flow
    plan: 03
    provides: "StepContact, StepReview, BookingSuccess client components"
provides:
  - "BookingForm root client component — useReducer with full bookingReducer (all 11 BookingAction cases), handleConfirm wrapped in startTransition"
  - "Two sessionStorage useEffects: restore on mount; save on state change (excluding contact PII)"
  - "Activated /book/[eventId] page — Wave 1 placeholder replaced with <BookingForm event={event} seatsLeft={seatsLeft} />"
  - "Re-exports of FormState/BookingAction/GuestDetail from BookingForm.tsx (canonical location per plan)"
affects:
  - phase-02-and-beyond

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useReducer + startTransition pattern for multi-step client wizards (instead of useActionState — picked because submission only happens at step 4 after collecting state across all steps)"
    - "PII exclusion via destructure-rest: `const { contact: _contact, ...nonPii } = state` before sessionStorage.setItem"
    - "Transient state never restored from sessionStorage: RESTORE forces isSubmitting=false, bookingId=null, errors={}"
    - "SSR safety: useEffect bodies short-circuit on `typeof window === 'undefined'` even though React only runs them client-side (defense-in-depth against hydration edge cases)"
    - "Defensive double-submit guard: handleConfirm early-returns if state.isSubmitting; reducer's SUBMIT/SET_ERROR/SET_SUCCESS toggle the flag synchronously; navigation Back button disables during submit"

key-files:
  created:
    - "src/app/(guest)/book/[eventId]/BookingForm.tsx"
  modified:
    - "src/app/(guest)/book/[eventId]/page.tsx (Plan 01 placeholder activated)"
    - "src/app/(guest)/book/[eventId]/StepParty.tsx (added contact field to canonical FormState)"

key-decisions:
  - "[Phase 01 Plan 04]: Canonical FormState/BookingAction/GuestDetail types continue to live (and are originally defined) in StepParty.tsx; BookingForm.tsx re-exports them. Avoids touching the four step files (StepParty/StepDietary/StepContact/StepReview) that already import from './StepParty' while still satisfying the plan's `export type { ... }` contract from BookingForm.tsx"
  - "[Phase 01 Plan 04]: Added missing `contact: { name; email; phone }` field to canonical FormState in StepParty.tsx — required for BookingForm to satisfy the FormState type when storing contact data"
  - "[Phase 01 Plan 04]: SET_PAX clamps winePairingCount to min(current, newPax) AND resizes guestDetails immutably; SET_WINE_OPT_IN resets winePairingCount to 0 when toggled off; SET_WINE_COUNT also clamps to current pax (defense in depth against late dispatch)"
  - "[Phase 01 Plan 04]: Used `useReducer` with synchronous `dispatch({ type: 'SUBMIT' })` BEFORE `startTransition(...)` — the flag flip is synchronous so the disabled state on the Confirm button takes effect before any subsequent click can register"

patterns-established:
  - "Type re-export from canonical authoring file: BookingForm.tsx re-exports types declared in StepParty.tsx — gives Plan 04+ a stable `import from './BookingForm'` surface without disturbing existing import sites"
  - "sessionStorage round-trip with PII exclusion + transient-state filtering on RESTORE — applicable to any future multi-step wizard"
  - "Double-submit prevention via reducer flag (synchronous) + button disabled (visual) + handler early-return (programmatic) + DB FOR UPDATE lock (server safety net)"

requirements-completed: [BOOK-06, BOOK-07, BOOK-08]

# Metrics
duration: 2min
completed: 2026-05-02
---

# Phase 01 Plan 04: Root Component Wiring and Page Activation Summary

**BookingForm root client component with full useReducer (11 actions), startTransition-wrapped handleConfirm, dual-effect sessionStorage persistence (restore on mount, save excluding contact PII), and activated /book/[eventId] page replacing the Wave 1 placeholder.**

## Performance

- **Duration:** ~2 min (127s)
- **Started:** 2026-05-02T02:30:03Z
- **Completed:** 2026-05-02T02:32:10Z
- **Tasks:** 2
- **Files modified:** 3 (1 created — BookingForm.tsx; 2 modified — page.tsx and StepParty.tsx)

## Accomplishments

- `BookingForm.tsx` (260 lines) implements the full booking wizard root: useReducer with all 11 BookingAction cases (`SET_PAX`, `SET_WINE_OPT_IN`, `SET_WINE_COUNT`, `SET_GUEST_DETAIL`, `SET_CONTACT`, `NEXT_STEP`, `PREV_STEP`, `GO_TO_STEP`, `SUBMIT`, `SET_ERROR`, `SET_SUCCESS`, `RESTORE`).
- `handleConfirm` dispatches `SUBMIT` synchronously before `startTransition(async () => await submitBooking(...))` so the Confirm button disables before any subsequent click can register; the result is dispatched via `SET_ERROR` or `SET_SUCCESS`.
- Two `useEffect` hooks for sessionStorage: restore on mount (with try/catch + corrupt-storage cleanup), save on every state change (with PII exclusion via `const { contact: _contact, ...nonPii } = state` + try/catch for storage-full edge cases). When `state.bookingId` is set, the entry is removed.
- `RESTORE` action forces `isSubmitting: false`, `bookingId: null`, `errors: {}` — transient/success state never round-trips through sessionStorage.
- `SET_PAX` resizes `guestDetails[]` immutably (trim or pad with `blankGuest()`) and clamps `winePairingCount = Math.min(current, newPax)` — closes Pitfall 3 (guestDetails ↔ pax) and Pitfall 5 (wine count > pax).
- `page.tsx` Wave 1 placeholder removed; `BookingForm` import activated; sold-out guard, ISR, and `seatsLeft` derivation unchanged.
- All 4 steps render conditionally based on `state.step`; navigation Back/Next buttons sit at the bottom with Back disabled during submission.
- `npm run build` exits 0 with `/book/[eventId]` registered; `npm run lint` reports 0 errors (5 pre-existing warnings in unrelated admin files persist as before).
- `npx tsc --noEmit` passes cleanly across the entire project.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BookingForm.tsx (root client component)** — `e3f30eb` (feat)
2. **Task 2: Activate BookingForm in page.tsx** — `620d83d` (feat)

**Plan metadata:** pending (final docs commit)

## Files Created/Modified

- `src/app/(guest)/book/[eventId]/BookingForm.tsx` — **created**. `'use client'`; default export `BookingForm({ event, seatsLeft })`. Re-exports `FormState`, `BookingAction`, `GuestDetail` (canonical originals live in `StepParty.tsx`). Defines `blankGuest()`, `resizeGuestDetails()`, `bookingReducer`, and `initialState`. Two `useEffect` hooks for sessionStorage. `handleConfirm` invokes `submitBooking` from `./actions` via `startTransition`. Renders `BookingSuccess` when `state.bookingId` is set.
- `src/app/(guest)/book/[eventId]/page.tsx` — **modified**. Removed `// import BookingForm from './BookingForm' // uncomment after Plan 04` comment and replaced with active `import BookingForm from './BookingForm'`. Replaced placeholder `<div className="min-h-screen bg-cream-50"><p>Booking form loading...</p></div>` with `<BookingForm event={event} seatsLeft={seatsLeft} />`.
- `src/app/(guest)/book/[eventId]/StepParty.tsx` — **modified**. Added `contact: { name: string; email: string; phone: string }` field to the canonical `FormState` type. No runtime change to the StepParty component itself; the field was missing from the type that StepReview/StepContact already implicitly relied on.

## Decisions Made

- **Re-export over relocate**: The plan's `<interfaces>` block instructs `export type { GuestDetail, FormState, BookingAction }` from `BookingForm.tsx`. The canonical types currently live in `StepParty.tsx` (Plan 02 decision, extended by Plan 03). I left them there and re-exported from `BookingForm.tsx`, rather than moving them and updating four import sites (StepParty/StepDietary/StepContact/StepReview). Both surfaces — `import from './StepParty'` and `import from './BookingForm'` — now work, and the migration to BookingForm-as-canonical is a single-file change in a future cleanup if desired. This reduces blast radius and keeps the diff focused.
- **Synchronous SUBMIT before startTransition**: `dispatch({ type: 'SUBMIT' })` runs before `startTransition(...)` so React's reconciler renders `state.isSubmitting === true` (and the disabled Confirm button) before any further user input can race the server action. Plus a defensive `if (state.isSubmitting) return` early-return at the top of `handleConfirm`.
- **`Math.min(current, newPax)` in SET_WINE_COUNT**: SET_WINE_COUNT also clamps to current pax (not just SET_PAX). Defense-in-depth against a late SET_WINE_COUNT dispatch arriving from a stale closure or a paste-replay scenario.
- **Try/catch around sessionStorage.setItem**: Storage quota exceeded (5MB browser default, but unusual extensions can pre-fill it) or storage disabled in private mode would throw. We swallow — sessionStorage is best-effort persistence; losing it just means the user re-enters non-PII data on refresh.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing `contact` field to canonical FormState in StepParty.tsx**
- **Found during:** Task 1 (BookingForm.tsx)
- **Issue:** The plan's `<interfaces>` block specifies `FormState` includes `contact: { name; email; phone }`, but the actual canonical type defined in `StepParty.tsx` (Plan 02) omits the `contact` field — Plan 02 didn't need it for StepParty's UI, and Plan 03's StepReview defined a separate inline type for its `state` prop. BookingForm.tsx, however, must own a `contact` field on `state` (the source of truth for SET_CONTACT, sessionStorage exclusion, and the `submitBooking` payload). Without this fix, `state.contact` would be a type error.
- **Fix:** Added `contact: { name: string; email: string; phone: string }` as a field of `FormState` in `StepParty.tsx`. This propagates correctly to BookingForm.tsx (via re-export) and is consistent with Plan 03's StepReview prop shape, StepContact's prop shape, and the plan's interface contract.
- **Files modified:** `src/app/(guest)/book/[eventId]/StepParty.tsx`
- **Verification:** `npx tsc --noEmit` passes; the `Pick<FormState, 'pax' | 'wineOptIn' | 'winePairingCount' | 'errors'>` slice that StepParty already uses is unaffected (it only picks fields StepParty needs).
- **Committed in:** `e3f30eb` (Task 1 commit)

**2. [Decision deviation - architecture] Re-exported types from BookingForm instead of relocating them**
- **Found during:** Task 1
- **Issue:** Plan instructs `export type { GuestDetail, FormState, BookingAction }` from BookingForm.tsx. The canonical declarations currently live in StepParty.tsx (Plan 02 decision, reinforced by Plan 03). Relocating them to BookingForm.tsx would require updating four files' import paths (StepParty, StepDietary, StepContact, StepReview).
- **Fix:** Kept the type declarations in StepParty.tsx and made BookingForm.tsx re-export them: `export type { FormState, BookingAction, GuestDetail }` after `import type { ... } from './StepParty'`. Both `import from './StepParty'` and `import from './BookingForm'` now work for these types.
- **Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx` (re-export only — no other file touched for this fix)
- **Verification:** `npx tsc --noEmit` exits 0; `npm run build` exits 0; the existing step components that import from `./StepParty` continue to work; downstream code that imports from `./BookingForm` (per the plan) also works.
- **Committed in:** `e3f30eb` (Task 1 commit)

**3. [Rule 2 - Missing critical functionality] Defensive guards in BookingForm**
- **Found during:** Task 1
- **Issue:** Plan's reducer template lacked: (a) clamp on SET_WINE_COUNT against current pax (only SET_PAX clamped, leaving a stale-dispatch race window), (b) `if (state.isSubmitting) return` in handleConfirm (the button's `disabled` attribute is a UI guard, not a programmatic one — events can still fire if the disabled state hasn't rendered yet or if an a11y tool dispatches a synthetic event), (c) `typeof window === 'undefined'` guards in the two useEffects (defensive for SSR-edge cases), (d) try/catch around `sessionStorage.setItem` (quota-exceeded), (e) try/catch around `JSON.parse` of restore payload (corrupt storage cleanup), (f) `disabled={state.isSubmitting}` on the Back button (preventing step navigation mid-submission).
- **Fix:** Added all six. None change the happy-path behavior; all are defense-in-depth against documented edge cases (Pitfall 3, Pitfall 5, T-04-02 from the plan's threat model).
- **Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx`
- **Verification:** Manual reasoning — happy path unchanged; double-click on Confirm now no-ops on the second click (verified by reading the code path); refresh after submission clears storage as expected.
- **Committed in:** `e3f30eb` (Task 1 commit)

---

**Total deviations:** 3 (1 blocking type fix, 1 architectural improvement, 1 defense-in-depth bundle). All preserve plan intent; happy-path behavior is identical to the spec.

**Impact on plan:** All deviations were either required for the build to pass (#1) or strictly improve robustness without altering behavior (#2, #3). No scope creep. The plan's success criteria are all met:

- BookingForm.tsx exists with complete bookingReducer (all action types) ✓
- handleConfirm dispatches SUBMIT, calls submitBooking via startTransition, dispatches SET_ERROR or SET_SUCCESS on result ✓
- sessionStorage restore effect runs once on mount; save effect runs on every state change excluding contact fields ✓
- seatsLeft prop threads correctly: page.tsx → BookingForm → StepParty ✓
- page.tsx renders BookingForm (not a placeholder); build passes ✓
- Visiting /book/[eventId] for a published event will show the full wizard (verified via build + manual reasoning; runtime check requires a published event with seats — not part of the executor's mandate)

## Issues Encountered

- None beyond the deviations above. The five pre-existing lint warnings in unrelated admin files (`src/app/admin/dishes/page.tsx`, `src/app/admin/events/[id]/page.tsx`, `src/app/admin/guests/page.tsx`, `src/components/ui/ImageUpload.tsx`, `src/lib/supabase/middleware.ts`) persist from prior phases and are out of scope per the executor scope rules.

## User Setup Required

None — pure UI integration. No new dependencies, no env vars, no service configuration.

## Next Phase Readiness

- Phase 01 (Booking Flow) is functionally complete: a guest can navigate to `/book/[eventId]`, select pax + wine pairing (Step 1), enter dietary information per guest (Step 2), provide contact details (Step 3), review and confirm (Step 4), and see a success state with their booking reference. The full happy path is wired end-to-end with a real Supabase RPC.
- Threat-model mitigations present: T-04-02 (double-submit) — guard + disabled button + DB lock; T-04-03 (PII in sessionStorage) — destructure-rest exclusion; T-04-04 (bookingId restored from storage) — RESTORE forces null. T-04-01 (RESTORE payload tampering) accepted per threat model — server-side Zod re-validates everything before the RPC call.
- Manual verification steps the user can run (after `npm run dev`):
  1. Navigate to `/book/[valid-published-event-id]` — full 4-step form renders.
  2. Fill step 1, advance to step 2, refresh browser — step and pax restore from sessionStorage; contact fields are absent from `sessionStorage.getItem('booking:<eventId>')`.
  3. Fill all 4 steps and confirm — Confirm button disables and shows "Reserving..." during submission.
  4. On success — BookingSuccess renders with the 8-char booking reference; sessionStorage entry is cleared.
- Future cleanup opportunity (not blocking): consider physically relocating the canonical type declarations from `StepParty.tsx` to `BookingForm.tsx` and updating the four step-file import paths. Cosmetic only — no behavior change. Deferred because it expands the diff without functional benefit.

## Threat Flags

None new. The plan's `<threat_model>` enumerated T-04-01 (sessionStorage tampering — accepted, server re-validates), T-04-02 (double-submit — mitigated), T-04-03 (PII in sessionStorage — mitigated), T-04-04 (bookingId from storage — mitigated). All mitigations specified in the threat register are present in the implementation. No new attack surface introduced; no new endpoints, no new file-system reads, no `dangerouslySetInnerHTML`, no eval, no untrusted URL navigation.

## Self-Check: PASSED

- FOUND: `src/app/(guest)/book/[eventId]/BookingForm.tsx`
- FOUND: `src/app/(guest)/book/[eventId]/page.tsx` (modified — placeholder removed, BookingForm activated)
- FOUND: `src/app/(guest)/book/[eventId]/StepParty.tsx` (modified — `contact` added to FormState)
- FOUND commit: `e3f30eb` (feat: BookingForm root client component)
- FOUND commit: `620d83d` (feat: activate BookingForm in page.tsx)
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0; `/book/[eventId]` route registered
- `npm run lint` reports 0 errors for new/modified files (5 pre-existing warnings in unrelated admin files only)

---
*Phase: 01-booking-flow*
*Completed: 2026-05-02*
