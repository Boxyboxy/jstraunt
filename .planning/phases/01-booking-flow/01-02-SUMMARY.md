---
phase: 01-booking-flow
plan: 02
subsystem: ui
tags: [next.js, react, client-component, controlled-inputs, useReducer, tailwind]

# Dependency graph
requires:
  - phase: 00-foundation
    provides: "Button/Input/Select UI atoms, formatCurrency utility, Database type, lucide-react"
  - phase: 01-booking-flow
    plan: 01
    provides: "Event row type via Database['public']['Tables']['events']['Row'] (no runtime dependency on Plan 01)"
provides:
  - "StepIndicator: pure presentational 4-step progress indicator (server-safe, no client directive)"
  - "StepParty: controlled Step-1 component (party size, optional wine pairing, price summary)"
  - "StepDietary: controlled Step-2 component (per-guest fieldsets with allergens, dietary, severity, special requests)"
  - "Inline FormState / BookingAction / GuestDetail types exported from StepParty.tsx for Plan 04 to consume"
affects:
  - 01-03-plan
  - 01-04-plan

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Controlled-input components driven by useReducer dispatch (no local state, no useActionState)"
    - "Inline type-sharing across step files via `import type ... from './StepParty'` until Plan 04 introduces BookingForm.tsx as the canonical source"
    - "Native checkbox/textarea + brand-token Tailwind classes (no new UI atoms required)"

key-files:
  created:
    - "src/app/(guest)/book/[eventId]/StepIndicator.tsx"
    - "src/app/(guest)/book/[eventId]/StepParty.tsx"
    - "src/app/(guest)/book/[eventId]/StepDietary.tsx"
  modified: []

key-decisions:
  - "Shared FormState/BookingAction/GuestDetail types live in StepParty.tsx and are imported into StepDietary.tsx — single source of truth before Plan 04 supersedes it"
  - "StepIndicator omits 'use client' (pure presentational, server-safe)"
  - "Pax option ceiling uses Math.max(1, Math.min(8, seatsLeft)) to guard against zero-seat edge cases (defensive — page-level sold-out guard already redirects in Plan 01)"

patterns-established:
  - "Step-N components receive `Pick<FormState, ...>` slices, not the full state, to make their data dependencies explicit"
  - "Checkbox-array fields use a local toggleArrayValue helper and dispatch the full new array (immutable updates)"
  - "Severity Select uses a typed options array `{ value: GuestDetail['severity']; label: string }[]` to lock the enum at compile time"

requirements-completed: [BOOK-01, BOOK-02]

# Metrics
duration: 2min
completed: 2026-05-02
---

# Phase 01 Plan 02: Step Indicator and Step 1/2 Components Summary

**Three controlled UI components for the 4-step booking flow: StepIndicator (pure 4-dot progress bar), StepParty (party size + wine pairing + price summary), and StepDietary (per-guest allergen/dietary fieldsets) — all typed against shared FormState/BookingAction definitions that Plan 04 will subsume.**

## Performance

- **Duration:** ~2 min (~117s)
- **Started:** 2026-05-02T02:17:54Z
- **Completed:** 2026-05-02T02:19:51Z
- **Tasks:** 2
- **Files created:** 3 (StepIndicator.tsx, StepParty.tsx, StepDietary.tsx)
- **Files modified:** 0

## Accomplishments

- `StepIndicator.tsx` renders 4 dots with active/done/pending states; completed steps show `<Check />` (lucide-react), active dot fills `bg-burgundy-700`, pending dots `bg-cream-300 text-burgundy-400`. No `'use client'` directive — server-safe.
- `StepParty.tsx` is a controlled Step 1: pax `<Select>` with options 1..min(8, seatsLeft), conditional wine-pairing controls gated on `event.wine_pairing`, and a live price summary computed from `state.pax * event.price_per_seat + (wineOptIn ? winePairingCount * wine_price : 0)`.
- `StepDietary.tsx` renders exactly `state.guestDetails.length` fieldsets, each containing: guest_name `<Input>`, 8-allergen checkbox grid, other_allergies `<Input>`, 5-option dietary checkbox grid, severity `<Select>` (preference/intolerance/life_threatening), and a special_requests `<textarea>`.
- All four reducer action types — `SET_PAX`, `SET_WINE_OPT_IN`, `SET_WINE_COUNT`, `SET_GUEST_DETAIL` — are dispatched with the exact field names defined in the plan's `<interfaces>` block.
- Inline `FormState`, `BookingAction`, and `GuestDetail` types are exported from `StepParty.tsx` so `StepDietary.tsx` (and, later, `StepContact`/`StepReview`) can import a single shared definition. Plan 04's `BookingForm.tsx` will become the canonical source and these can be deleted then.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create StepIndicator** — `d723c42` (feat)
2. **Task 2: Create StepParty + StepDietary** — `a76e585` (feat)

**Plan metadata:** pending (final docs commit)

## Files Created/Modified

- `src/app/(guest)/book/[eventId]/StepIndicator.tsx` — 53 lines; pure component; default export `StepIndicator({ current })`; uses `Check` icon for completed steps; adds `aria-current="step"` on the active dot for screen readers.
- `src/app/(guest)/book/[eventId]/StepParty.tsx` — 158 lines; `'use client'`; default export `StepParty({ event, seatsLeft, state, dispatch })`; also exports shared types (`FormState`, `BookingAction`, `GuestDetail`).
- `src/app/(guest)/book/[eventId]/StepDietary.tsx` — 198 lines; `'use client'`; default export `StepDietary({ state, dispatch })`; imports shared types from `./StepParty`.

## Decisions Made

- Shared the inline `FormState`/`BookingAction`/`GuestDetail` types via `StepParty.tsx` rather than duplicating them in `StepDietary.tsx`. The plan suggested duplicating in each file, but identical type blocks across two files invite drift and add noise to Plan 04's eventual cleanup (now: replace one set of imports; before: replace two duplicated blocks). Documented as a key decision.
- Used `Math.max(1, Math.min(8, seatsLeft))` for pax options instead of plain `Math.min(8, seatsLeft)`. If `seatsLeft` ever reached 0, the bare formula would generate an empty `Array.from({ length: 0 })` and an empty `<Select>`. The Plan 01 page-level guard renders a sold-out state before this component mounts, but the defensive clamp is cheap insurance against a future regression.
- Added `aria-current="step"` to the active step indicator and `aria-hidden="true"` to the decorative track segments — accessibility polish on a pure component, no behavioral change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Defensive clamp on pax options ceiling**
- **Found during:** Task 2 (StepParty)
- **Issue:** `Math.min(8, seatsLeft)` becomes `0` when `seatsLeft === 0`, producing an empty `<Select>` with no options. The page-level sold-out guard in Plan 01 prevents this in practice, but defense in depth is cheap here.
- **Fix:** Use `Math.max(1, Math.min(8, seatsLeft))` so the Select always has at least one option even on a degenerate call.
- **Files modified:** `src/app/(guest)/book/[eventId]/StepParty.tsx`
- **Committed in:** `a76e585`

**2. [Rule 1 - Avoiding bug] Wine count options ceiling**
- **Found during:** Task 2 (StepParty)
- **Issue:** `Array.from({ length: state.pax }, ...)` produces an empty array when `state.pax === 0` (transient state during initial render or invalid inputs).
- **Fix:** `Array.from({ length: Math.max(1, state.pax) }, ...)` for symmetric defensiveness.
- **Files modified:** `src/app/(guest)/book/[eventId]/StepParty.tsx`
- **Committed in:** `a76e585`

**3. [Decision deviation] Shared types live in StepParty, not duplicated**
- **Found during:** Task 2 (StepDietary)
- **Issue:** Plan instructed both files to inline duplicate `FormState`/`BookingAction` definitions. This creates drift risk and makes Plan 04's cleanup harder.
- **Fix:** Export shared types from `StepParty.tsx` and import them in `StepDietary.tsx`. Plan 04 will move them to `BookingForm.tsx` and update both step files in one swap.
- **Files modified:** `src/app/(guest)/book/[eventId]/StepParty.tsx` (added `export` keyword), `src/app/(guest)/book/[eventId]/StepDietary.tsx` (uses `import type ... from './StepParty'`)
- **Committed in:** `a76e585`

---

**Total deviations:** 3 (2 defensive guards, 1 architectural improvement). All preserve plan intent — same behavior in the happy path, more robust at the edges, and cleaner to refactor in Plan 04.

## Issues Encountered

- None. Five pre-existing lint warnings in unrelated admin files persisted from before this plan — out of scope, ignored per the executor scope rules.

## User Setup Required

None — all components are pure UI assembled from existing UI atoms and brand tokens. No new dependencies, no new env vars.

## Next Phase Readiness

- `BookingForm.tsx` (Plan 04) can `import StepIndicator from './StepIndicator'`, `import StepParty from './StepParty'`, `import StepDietary from './StepDietary'` and pass `state`/`dispatch` directly.
- The reducer in Plan 04 must implement the action types `SET_PAX`, `SET_WINE_OPT_IN`, `SET_WINE_COUNT`, `SET_GUEST_DETAIL` with the exact payload shapes defined in `StepParty.tsx`. When Plan 04 introduces `BookingForm.tsx`, move the type exports there and update the two step-file imports.
- Plan 03 (StepContact + StepReview) can also import the shared types from `StepParty.tsx` to stay consistent with this convention.

## Threat Flags

None new. The plan's `<threat_model>` enumerates T-02-01 (client pax cap as UX guard only — RPC seat lock is authoritative; no mitigation required), T-02-02 (free-text fields stored as-is for the chef — Zod length checks before RPC), and T-02-03 (no PII in this layer — contact step persists separately). No new attack surface introduced; no `dangerouslySetInnerHTML`, no eval, no untrusted URL navigation, no new endpoints.

## Self-Check: PASSED

- FOUND: `src/app/(guest)/book/[eventId]/StepIndicator.tsx`
- FOUND: `src/app/(guest)/book/[eventId]/StepParty.tsx`
- FOUND: `src/app/(guest)/book/[eventId]/StepDietary.tsx`
- FOUND commit: `d723c42` (feat: StepIndicator)
- FOUND commit: `a76e585` (feat: StepParty + StepDietary)
- `npm run build` exits 0; `/book/[eventId]` route registered.
- `npm run lint` reports 0 errors for new files (5 pre-existing warnings in unrelated admin files).
- `npx tsc --noEmit` passes for all three files.

---
*Phase: 01-booking-flow*
*Completed: 2026-05-02*
