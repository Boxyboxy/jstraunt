---
phase: 01-booking-flow
plan: 03
subsystem: ui
tags: [next.js, react, client-component, controlled-inputs, useReducer, tailwind, lucide-react]

# Dependency graph
requires:
  - phase: 00-foundation
    provides: "Input/Button/Badge UI atoms, formatCurrency/formatDate/formatTime utilities, Database type, lucide-react"
  - phase: 01-booking-flow
    plan: 02
    provides: "Shared FormState/BookingAction/GuestDetail types exported from StepParty.tsx"
provides:
  - "StepContact: controlled Step-3 component (name/email/phone Inputs with autocomplete)"
  - "StepReview: presentational Step-4 component (read-only summary with per-section Edit buttons and Confirm Booking action)"
  - "BookingSuccess: post-submission success view (UUID reference, Back to Events link, sessionStorage cleanup on mount)"
affects:
  - 01-04-plan

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Controlled inputs with errors prop passed directly (no local state) — consistent with StepParty/StepDietary"
    - "Shared BookingAction/GuestDetail types imported from StepParty.tsx — single source of truth before Plan 04 supersedes"
    - "Per-section Edit buttons dispatch GO_TO_STEP with literal step numbers — no URL routing involved"
    - "sessionStorage cleanup via useEffect on mount of success view (idempotent on event.id change)"

key-files:
  created:
    - "src/app/(guest)/book/[eventId]/StepContact.tsx"
    - "src/app/(guest)/book/[eventId]/StepReview.tsx"
    - "src/app/(guest)/book/[eventId]/BookingSuccess.tsx"
  modified: []

key-decisions:
  - "StepContact and StepReview import the shared BookingAction (and GuestDetail) types from StepParty.tsx instead of inlining duplicate type definitions — extends the Plan 02 single-source-of-truth pattern and keeps the Plan 04 type-migration trivial"
  - "StepReview Confirm Booking button is rendered inline at the bottom of the step content; the BookingForm fixed footer (Plan 04) will provide the primary CTA but this inline button gives users a confirm action they can see without scrolling past the summary"
  - "BookingSuccess clears sessionStorage with `event.id` in the effect dependency array to make it safely re-runnable if the success view ever remounts"
  - "Used `&apos;` and `&ldquo;`/`&rdquo;` HTML entities for apostrophe and quotes to satisfy `react/no-unescaped-entities` lint rule"

patterns-established:
  - "Step components receive an `errors: Record<string, string>` prop (not a state.errors slice) — flat error keys at the dispatch site"
  - "Edit buttons in summary views are plain `<button type='button'>` elements styled with `text-xs text-burgundy-700 underline` — no Link, no URL change"
  - "Success references are derived from the first 8 chars of the booking UUID, displayed in monospace via Tailwind `font-mono`"

requirements-completed: [BOOK-03, BOOK-04]

# Metrics
duration: 2min
completed: 2026-05-02
---

# Phase 01 Plan 03: Step Contact, Step Review, and Booking Success Summary

**Three remaining UI components for the booking flow: StepContact (Step 3 — controlled name/email/phone Inputs), StepReview (Step 4 — read-only summary with per-section Edit buttons, price breakdown, and Confirm Booking action), and BookingSuccess (post-submission view with UUID reference, sessionStorage cleanup, and Back to Events link).**

## Performance

- **Duration:** ~89 seconds
- **Started:** 2026-05-02T02:25:34Z
- **Completed:** 2026-05-02T02:27:03Z
- **Tasks:** 2
- **Files created:** 3 (StepContact.tsx, StepReview.tsx, BookingSuccess.tsx)
- **Files modified:** 0

## Accomplishments

- `StepContact.tsx` — three `<Input>` atoms for name (`autoComplete="name"`), email (`type="email"` `autoComplete="email"`), and phone (`type="tel"` `autoComplete="tel"` `placeholder="+65"`). Each input dispatches `SET_CONTACT` with `field` and `value`. Errors bind directly from the `errors` prop (no `state?.errors` indirection).
- `StepReview.tsx` — read-only summary of all four data groups (event header, party, per-guest dietary details, contact). Per-section Edit buttons dispatch `GO_TO_STEP` with literal step numbers (1 for Party, 2 for Dietary, 3 for Contact). Price breakdown uses `formatCurrency`. Confirm Booking button calls `onConfirm` prop, disables during `state.isSubmitting`, and shows "Reserving..." copy. `_form` errors render in a red banner above the sections.
- `BookingSuccess.tsx` — full-page replacement with `lucide-react` `CheckCircle` icon (64px, `text-sage-600`), bold "Booking Confirmed" heading, summary line ("{pax} seats at {event_title}"), 8-char monospace booking reference, and a `Back to Events` link to `/events`. `useEffect` on mount clears `sessionStorage.removeItem(\`booking:${event.id}\`)`.
- All three files type-check cleanly (`npx tsc --noEmit` exits 0) and the full `npm run build` succeeds with the `/book/[eventId]` route registered. `npm run lint` reports 0 new errors (only the 5 pre-existing warnings in unrelated admin files persist).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create StepContact (Step 3)** — `0d9906b` (feat)
2. **Task 2: Create StepReview + BookingSuccess** — `f716344` (feat)

**Plan metadata:** pending (final docs commit)

## Files Created/Modified

- `src/app/(guest)/book/[eventId]/StepContact.tsx` — 64 lines; `'use client'`; default export `StepContact({ contact, errors, dispatch })`. Imports `BookingAction` from `./StepParty`. Three `<Input>` atoms with `required` and the correct `autoComplete` / `type` / `placeholder` attributes.
- `src/app/(guest)/book/[eventId]/StepReview.tsx` — 175 lines; `'use client'`; default export `StepReview({ event, state, dispatch, onConfirm })`. Imports `BookingAction` and `GuestDetail` from `./StepParty`. Renders 5 cream-200 rounded cards (Event, Party, Dietary, Contact, Price) plus the inline Confirm Booking `<Button>` and a top-of-form `_form` error banner. Severity badges use `Badge variant="danger"` for `life_threatening` and `warning` for `intolerance`; preferences render no badge.
- `src/app/(guest)/book/[eventId]/BookingSuccess.tsx` — 60 lines; `'use client'`; default export `BookingSuccess({ bookingId, pax, event })`. Centered `min-h-screen` layout with the `CheckCircle` icon, heading, summary line, monospace reference card, and a styled `<Link href="/events">` button. The `useEffect` cleanup runs on mount and re-runs only if `event.id` changes.

## Decisions Made

- **Imported shared types from `StepParty.tsx` instead of duplicating** — the Plan 02 summary established that the inline `FormState`/`BookingAction`/`GuestDetail` types live in `StepParty.tsx`. The Plan 03 example code re-inlined truncated versions of the action union (`{ type: 'SET_CONTACT'; ... } | { type: string; [key: string]: unknown }`); using the canonical exports gives StepContact and StepReview the full discriminated-union narrowing for free, which is strictly better for type safety and means Plan 04 only needs to update one file when the types migrate to `BookingForm.tsx`. Documented as deviation #1 below.
- **Used HTML entities for apostrophes and quotes** — `react/no-unescaped-entities` would flag literal `'` and `"` characters inside JSX text. Used `&apos;` for `You'll` (BookingSuccess) and `&ldquo;`/`&rdquo;` for the special-requests block-quote (StepReview). No copy change.
- **Inline Confirm button placement** — kept the inline `<Button variant="primary" size="lg" className="w-full">` at the bottom of `StepReview` even though Plan 04's `BookingForm` will render the primary CTA in a fixed footer. The inline button is read as a natural action right after the summary; the fixed footer button is for users who don't scroll. Both are wired through `onConfirm`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Decision deviation - architecture] Imported shared types from `StepParty.tsx` instead of inlining truncated duplicates**
- **Found during:** Tasks 1 and 2
- **Issue:** The plan's example code inlines partial type definitions: `type BookingAction = | { type: 'SET_CONTACT'; ... } | { type: string; [key: string]: unknown }`. This permissive fallback (`type: string`) defeats discriminated-union narrowing — TypeScript can't verify the dispatch shape at the call site. Plan 02 already established that the canonical types live in `StepParty.tsx`.
- **Fix:** `import type { BookingAction } from './StepParty'` in `StepContact.tsx` and `import type { BookingAction, GuestDetail } from './StepParty'` in `StepReview.tsx`. Removed the inlined permissive fallback unions.
- **Files modified:** `src/app/(guest)/book/[eventId]/StepContact.tsx`, `src/app/(guest)/book/[eventId]/StepReview.tsx`
- **Verification:** `npx tsc --noEmit` passes; `dispatch({ type: 'GO_TO_STEP', step: 1 })` and `dispatch({ type: 'SET_CONTACT', field, value })` are now both fully type-narrowed against the canonical action union.
- **Committed in:** `0d9906b` (Task 1) and `f716344` (Task 2)

**2. [Rule 3 - Blocking] Escaped apostrophe and quote characters in JSX text**
- **Found during:** Task 2 (StepReview, BookingSuccess)
- **Issue:** Literal `'` and `"` inside JSX text trigger `react/no-unescaped-entities` (default ESLint config). Plan example used a literal `'` in `You'll receive...` and literal `"..."` quotes around the special-requests preview, both of which would fail `npm run lint`.
- **Fix:** Replaced with `&apos;` and `&ldquo;`/`&rdquo;` entities. Visible copy is identical.
- **Files modified:** `src/app/(guest)/book/[eventId]/StepReview.tsx`, `src/app/(guest)/book/[eventId]/BookingSuccess.tsx`
- **Verification:** `npm run lint` reports 0 errors for the new files.
- **Committed in:** `f716344` (Task 2)

---

**Total deviations:** 2 (1 architectural improvement, 1 blocking lint fix). Both preserve plan intent — visible behavior identical, types stricter, lint clean.

## Issues Encountered

- None beyond the deviations above. The five pre-existing lint warnings in unrelated admin files persist as before — out of scope per executor scope rules.

## User Setup Required

None — pure UI components assembled from existing UI atoms, brand tokens, and `lucide-react` icons. No new dependencies, no env vars, no service configuration.

## Next Phase Readiness

- `BookingForm.tsx` (Plan 04) can `import StepContact from './StepContact'`, `import StepReview from './StepReview'`, and `import BookingSuccess from './BookingSuccess'` and pass `state` / `dispatch` (plus `onConfirm` for StepReview and `bookingId`/`pax`/`event` for BookingSuccess).
- All three components rely on the canonical `FormState`/`BookingAction`/`GuestDetail` types now exported from `StepParty.tsx`. When Plan 04 introduces `BookingForm.tsx`, move the type exports there and update the four step files (StepParty, StepDietary, StepContact, StepReview) in one swap.
- The reducer in Plan 04 must implement `SET_CONTACT { field, value }`, `GO_TO_STEP { step: 1|2|3|4 }`, and the existing `SET_PAX/SET_WINE_*/SET_GUEST_DETAIL/NEXT_STEP/PREV_STEP/SUBMIT/SET_ERROR/SET_SUCCESS/RESTORE` action types defined in `StepParty.tsx`.
- The `BookingSuccess` component's sessionStorage cleanup is idempotent — Plan 04 may also clear sessionStorage in the SUBMIT/SUCCESS path of the reducer side-effect, and the double-clear is harmless.

## Threat Flags

None new. The plan's `<threat_model>` enumerated:
- **T-03-01 (Information Disclosure — contact in state):** mitigation lives in `BookingForm.tsx` (Plan 04), not in this plan. StepContact stores values via reducer dispatch only; no sessionStorage write happens from this component.
- **T-03-02 (Information Disclosure — bookingId in DOM):** accepted; UUIDs are non-guessable and the truncated 8-char display is cosmetic.
- **T-03-03 (Tampering — GO_TO_STEP dispatch):** accepted; client-side state navigation only.

No new attack surface introduced. No `dangerouslySetInnerHTML`, no eval, no untrusted URL navigation, no new endpoints, no new file-system reads.

## Self-Check: PASSED

- FOUND: `src/app/(guest)/book/[eventId]/StepContact.tsx`
- FOUND: `src/app/(guest)/book/[eventId]/StepReview.tsx`
- FOUND: `src/app/(guest)/book/[eventId]/BookingSuccess.tsx`
- FOUND commit: `0d9906b` (feat: StepContact)
- FOUND commit: `f716344` (feat: StepReview + BookingSuccess)
- `npx tsc --noEmit` exits 0
- `npm run build` succeeds; `/book/[eventId]` route registered
- `npm run lint` reports 0 errors for new files (5 pre-existing warnings in unrelated admin files only)

---
*Phase: 01-booking-flow*
*Completed: 2026-05-02*
