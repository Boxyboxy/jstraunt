---
phase: 01-booking-flow
fixed_at: 2026-05-03T00:00:00Z
review_path: .planning/phases/01-booking-flow/01-REVIEW.md
iteration: 2
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 1: Code Review Fix Report

**Fixed at:** 2026-05-03
**Source review:** .planning/phases/01-booking-flow/01-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 3 (Critical: 0, Warning: 3)
- Fixed: 3
- Skipped: 0

Iteration 2 surfaced three new warnings after the iteration 1 fix pass.
All three were addressed; Info findings (IN-01..IN-04) were intentionally
out of scope per the `critical_warning` fix scope.

## Fixed Issues

### WR-01: `winePairingCount` is not clamped when restoring a payload that omits `pax`

**Files modified:** `src/app/(guest)/book/[eventId]/BookingForm.tsx`
**Commit:** 654a3b0
**Applied fix:** Resolve a `resolvedPax` value up-front in the restore
effect — using the restored-and-clamped `data.pax` when present, otherwise
falling back to the same `INITIAL_PAX`-clamped-to-`seatsLeft` value used by
`buildInitialState`. `guestDetails` is now resized whenever either
`data.guestDetails` or `data.pax` is present, and `winePairingCount` is
clamped against `resolvedPax` whenever the payload includes it. This
prevents controlled-select desync in StepParty and stale-card desync in
StepDietary when a payload contains a subset of the persisted fields.
The reducer-level alternative was considered but rejected: the effect
already has `seatsLeft` in scope and the restore action remains
state-shape-only.

### WR-02: Server-side Zod field errors with nested paths are not surfaced per-field on the client

**Files modified:** `src/app/(guest)/book/[eventId]/actions.ts`
**Commit:** de034f9
**Applied fix:** Replaced `parsed.error.flatten().fieldErrors` iteration
with a direct loop over `parsed.error.issues`, joining `issue.path` with
`.` to produce dotted keys (`guestDetails.0.guest_name`) that match the
client's `state.errors` shape. The first issue per field is kept (matches
the previous flatten-based behavior). The existing UI-name remap
(`guestName` -> `name`, etc.) is preserved.

### WR-03: `bookingId: null` falls through to `SET_SUCCESS` without runtime validation

**Files modified:** `src/app/(guest)/book/[eventId]/actions.ts`
**Commit:** 52daf51
**Applied fix:** Added a `typeof data !== 'string' || data.length === 0`
guard between the RPC error check and the success return. On invalid
data, returns an explicit support-contact error instead of dispatching
`SET_SUCCESS` with a falsy bookingId (which would silently re-render the
form with no error and no confirmation after the seat reservation had
already executed).

---

_Fixed: 2026-05-03_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
