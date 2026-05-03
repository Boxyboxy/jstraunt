---
status: complete
phase: 01-booking-flow
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md]
started: 2026-05-03T00:00:00Z
updated: 2026-05-03T00:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `npm run dev` from a clean state. Server boots without errors, /book/[eventId] route registers, and visiting a published event URL returns a live page (no 500, no hydration error).
result: pass
note: "First attempt failed with placehold.co not whitelisted in next.config.ts images.remotePatterns. Fixed inline (added placehold.co to images.remotePatterns); passed on re-run."

### 2. Load Booking Page (Published Event)
expected: Navigate to /book/{published-event-id}. Page renders with event title, date/time, price, and the 4-step wizard starting on Step 1 (Party). StepIndicator shows dot 1 active, dots 2-4 pending.
result: pass

### 3. Sold-Out Guard
expected: Navigate to /book/{sold-out-or-zero-seats-event-id}. Inline sold-out state renders (no wizard) with a "Back to Events" link instead of the form.
result: pass

### 4. Step 1 — Party Size & Price Summary
expected: Pax Select shows options 1..min(8, seatsLeft). Changing pax updates the live price summary (pax × price_per_seat). If event has wine_pairing, a wine-pairing toggle appears; toggling on shows wine count selector defaulted to current pax; price updates with wine cost.
result: pass
note: "First attempt failed: pax/wine changes didn't update price; Next didn't advance. Root cause: Next.js dev was browsed via LAN IP 192.168.18.90 — without allowedDevOrigins config, cross-origin requests were silently blocking React event handlers. Fixed by adding `allowedDevOrigins: ['192.168.18.90']` to next.config.ts. Re-verified pass."

### 5. Step 2 — Dietary Fieldsets
expected: Step 2 renders exactly N guest fieldsets (where N = pax from Step 1). Each fieldset has: name input, 8-allergen checkbox grid, "other allergies" input, 5-option dietary checkbox grid, severity select (preference/intolerance/life_threatening), special requests textarea. Checkboxes toggle independently per guest.
result: pass
note: "Initially blocked by allowedDevOrigins issue (see Test 4). Re-verified pass after fix."

### 6. Step 3 — Contact Form
expected: Step 3 renders 3 inputs: Name (autoComplete=name), Email (type=email), Phone (type=tel, placeholder "+65"). All required. Typing into each updates state. Going Back to Step 2 then forward returns the typed contact values.
result: issue
reported: "For Phone (type=tel, placeholder \"+65\"). No validation on number. alphabets are allowed"
severity: major

### 7. Step 4 — Review & Edit Buttons
expected: Step 4 shows read-only summary cards: Event header, Party (pax + wine), Dietary (per-guest details with severity badges — danger for life_threatening, warning for intolerance), Contact, Price breakdown. Each section has an Edit button that jumps back to the corresponding step preserving entered data.
result: pass

### 8. Per-Step Validation Gates
expected: Try clicking Next with required fields empty (e.g., empty guest name on Step 2, missing email on Step 3). Next is blocked and field-level errors surface inline (red text under offending input). Cannot advance past Step 3 without all contact fields filled.
result: pass

### 9. Submit Booking — Happy Path
expected: From Step 4, click Confirm Booking. Button immediately disables and shows "Reserving...". On success, the wizard is replaced by BookingSuccess: green CheckCircle icon, "Booking Confirmed" heading, summary line ("{pax} seats at {event_title}"), full booking UUID in monospace, Back to Events link.
result: pass

### 10. Double-Submit Prevention
expected: On Step 4, click Confirm Booking rapidly (3-5 times). Only one booking is created (check DB or success view appears once). Button stays disabled after first click; no double-confirmation, no duplicate row.
result: pass

### 11. sessionStorage Restore (No PII)
expected: On Step 3, fill in contact details, advance to Step 4. Refresh the browser. The wizard restores to Step 4 with pax/wine/dietary intact, BUT contact fields are empty (PII excluded from sessionStorage). Open DevTools → Application → sessionStorage → key `booking:{eventId}` — confirm no name/email/phone present.
result: pass

### 12. Back Button Disabled During Submit
expected: On Step 4, click Confirm. While "Reserving..." is showing, the Back button is disabled (cannot navigate away mid-submission).
result: pass

### 13. Booking Reference Lookup-Friendly
expected: After successful booking, the displayed reference is the FULL UUID (not truncated 8 chars). Support staff can copy this verbatim and find the row uniquely in the bookings table.
result: pass

### 14. Server Validation Rejects Bad Payload
expected: (Optional, requires devtools) Use browser console to call submitBooking with an invalid payload (e.g., pax: 999 or empty guest name). Server returns `{ error: "Invalid booking data" }` — no DB row created, no PostgreSQL error leaked.
result: skipped
reason: "Optional test; covered indirectly by Zod schema (bookingSchema in actions.ts:28) which gates all payloads server-side. Client validation already verified in Test 8. User opted to skip explicit DevTools breakpoint test."

## Summary

total: 14
passed: 12
issues: 1
pending: 0
skipped: 1
blocked: 0

## Gaps

- truth: "Phone field accepts only valid phone numbers (digits, optional leading +, length appropriate for SG numbers)"
  status: failed
  reason: "User reported: For Phone (type=tel, placeholder \"+65\"). No validation on number. alphabets are allowed"
  severity: major
  test: 6
  artifacts: []
  missing: []
