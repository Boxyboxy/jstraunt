---
phase: 1
slug: booking-flow
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-26
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test suite configured |
| **Config file** | none |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-T1 | 01-01 | 1 | BOOK-05 | T-01-01, T-01-03 | Zod rejects invalid payload; mapRpcError hides PG internals | build | `npm run build && grep -n "mapRpcError" src/app/\(guest\)/book/\[eventId\]/actions.ts` | ✅ | ⬜ pending |
| 01-T2 | 01-01 | 1 | BOOK-06 | T-01-02 | Sold-out guard renders inline message; 404 on unknown ID | build | `npm run build 2>&1 \| grep -E "error TS\|compiled successfully"` | ✅ | ⬜ pending |
| 02-T1 | 01-02 | 1 | BOOK-01 | T-02-01 | Step indicator renders correct colors; no client directive | build | `npx tsc --noEmit 2>&1 \| grep "StepIndicator"` | ✅ | ⬜ pending |
| 02-T2 | 01-02 | 1 | BOOK-01, BOOK-02 | T-02-02 | pax capped at min(8,seatsLeft); SET_GUEST_DETAIL dispatched per field | build | `npx tsc --noEmit 2>&1 \| grep -E "StepParty\|StepDietary"` | ✅ | ⬜ pending |
| 03-T1 | 01-03 | 1 | BOOK-03 | T-03-01 | errors prop used directly (no state?.errors); autocomplete attributes set | build | `npx tsc --noEmit 2>&1 \| grep "StepContact"` | ✅ | ⬜ pending |
| 03-T2 | 01-03 | 1 | BOOK-04 | T-03-02 | GO_TO_STEP dispatched for all three edit links; isSubmitting disables button | build | `npx tsc --noEmit 2>&1 \| grep -E "StepReview\|BookingSuccess"` | ✅ | ⬜ pending |
| 04-T1 | 01-04 | 2 | BOOK-07, BOOK-08 | T-04-02, T-04-03 | isSubmitting guard on SUBMIT; contact excluded from sessionStorage | build | `npm run build && grep -n "_contact" src/app/\(guest\)/book/\[eventId\]/BookingForm.tsx` | ✅ | ⬜ pending |
| 04-T2 | 01-04 | 2 | BOOK-06 | T-04-01 | seatsLeft prop flows page → BookingForm → StepParty; build clean | build | `npm run build 2>&1 \| grep -E "error TS\|compiled successfully"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework to install — project has no test suite configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 4-step form navigation | BOOK-01 | UI interaction flow | Navigate through all 4 steps, verify Back/Next works |
| Seat availability display | BOOK-06 | Requires live Supabase data | Create event with limited seats, verify seatsLeft caps pax Select |
| Double-submit prevention | BOOK-07 | Requires rapid click testing | Click confirm button rapidly, verify only one booking created and button disables |
| sessionStorage persistence | BOOK-08 | Browser-specific behavior | Fill form to step 3, refresh browser, verify step/pax/guestDetails restored but contact blank |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (no Wave 0 needed — no test framework)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
