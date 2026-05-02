---
phase: 01-booking-flow
reviewed: 2026-05-02T00:00:00Z
depth: standard
files_reviewed: 9
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
findings:
  critical: 4
  warning: 8
  info: 5
  total: 17
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-02
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

The Phase 1 booking flow is well-organized: a 4-step reducer-driven wizard with a thin server action that delegates atomicity to the SECURITY DEFINER `create_booking` RPC. The atomic seat-reservation pattern is sound, and the choice to omit the contact field from sessionStorage is good PII hygiene.

However, several defects could cause real user-visible problems:

1. **No client-side validation gates between steps.** A guest can click Next through Steps 1-3 with empty/invalid data and reach the Confirm button; the only validation is server-side. Errors bubble back as a generic "Invalid booking data" with no per-field feedback, causing a dead-end UX.
2. **Wine opt-in submits with `winePairingCount: 0`.** The default count is 0 with options starting at 1, so the controlled `<Select>` mounts in an out-of-range state and a user who simply checks the box and proceeds will submit a wine-pairing booking with zero pairings.
3. **`RESTORE` blindly merges untrusted sessionStorage data into reducer state.** No runtime shape validation — a malformed payload (or one persisted with stale `pax > seatsLeft`) can desync `pax`/`guestDetails`/`winePairingCount` and break controlled-component invariants.
4. **`pax`/`maxPax` desync when `seatsLeft < INITIAL_PAX`.** Initial state has `pax = 2`, but `paxOptions` is capped at `seatsLeft`. If `seatsLeft === 1`, `<Select value="2">` renders but only `[1]` is in options — React warns about controlled-vs-actual value mismatch and the displayed UI lies about party size.

The submission path is otherwise robust thanks to the RPC, but the front-end happily lets users submit invalid combinations that the back-end will reject with confusing messages.

## Critical Issues

### CR-01: Wine opt-in defaults to 0 pairings, allowing nonsensical submission

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:46-56`, `src/app/(guest)/book/[eventId]/StepParty.tsx:70-76, 118-132`
**Severity:** BLOCKER

**Issue:** Initial state has `winePairingCount: 0`. When the user checks the wine opt-in box (`SET_WINE_OPT_IN` with `value: true`), the reducer keeps `winePairingCount` at its current value (0). The wine-count `<Select>` is then rendered with `value="0"` but its `wineCountOptions` start at `1` (`Array.from({ length: state.pax }, (_, i) => ({ value: String(i + 1) }))`). This causes:

1. A controlled-select mismatch (no option matches `value="0"` → React warns, browser may pick the first option visually but state stays 0).
2. A user who simply ticks "Add wine pairing" and hits Next/Confirm submits `wineOptIn=true, winePairingCount=0` — Zod's `winePairingCount: z.number().int().min(0)` accepts it, and the RPC computes `0 * wine_price = 0`, so the booking is created with zero wine pairings despite the user opting in. The user's intent is silently lost.

**Fix:** When `SET_WINE_OPT_IN` flips on, default `winePairingCount` to `state.pax` (or at least 1). And/or refuse to submit if `wineOptIn && winePairingCount === 0`.

```tsx
case 'SET_WINE_OPT_IN':
  return {
    ...state,
    wineOptIn: action.value,
    winePairingCount: action.value
      ? (state.winePairingCount > 0 ? state.winePairingCount : state.pax)
      : 0,
    errors: {},
  }
```

Also add to `bookingSchema` in `validators.ts`:

```ts
.refine(
  (data) => data.winePairingCount === 0 || data.winePairingCount >= 1,
  { message: 'Wine pairing count must be at least 1 when enabled' }
)
```

---

### CR-02: No per-step validation — invalid data reaches the server with a useless error

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:94-101, 245-253`, `src/app/(guest)/book/[eventId]/actions.ts:26-28`
**Severity:** BLOCKER

**Issue:** The `NEXT_STEP` reducer case unconditionally advances the step. The user can:

- Reach Step 2 with `pax=2` then proceed to Step 4 without filling in any guest names.
- Reach Step 4 with `contact.name=''`, `contact.email=''`, `contact.phone=''` — `<input required>` HTML validation never fires because the form is not submitted via a real `<form onSubmit>`; the Confirm button is a `type="button"`.
- Click "Confirm Booking", which calls `submitBooking`, which calls `bookingSchema.safeParse` and returns the catch-all `{ error: 'Invalid booking data' }` — no field-level breakdown is sent back.

The user sees only a generic error in the form banner with no indication of which field is wrong, no scroll-to-error, no per-field highlighting. `errors` is typed `Record<string, string>` and `StepContact` already wires up `errors.name`/`errors.email`/`errors.phone`, but nothing ever populates them.

**Fix:** Add a step-level validator before each `NEXT_STEP` dispatch (or do it inside the reducer). Suggested:

```tsx
function validateStep(state: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (state.step === 1) {
    if (state.wineOptIn && state.winePairingCount < 1) {
      errors.winePairingCount = 'Choose at least one wine pairing'
    }
  }
  if (state.step === 2) {
    state.guestDetails.forEach((g, i) => {
      if (!g.guest_name.trim()) errors[`guestDetails.${i}.guest_name`] = 'Required'
    })
  }
  if (state.step === 3) {
    if (!state.contact.name.trim()) errors.name = 'Required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.email)) errors.email = 'Valid email required'
    if (!state.contact.phone.trim()) errors.phone = 'Required'
  }
  return errors
}
```

Run this before dispatching `NEXT_STEP` and before `handleConfirm`. Additionally, when the server action returns a Zod error, surface field-level issues by returning `parsed.error.flatten().fieldErrors` rather than a flat string.

---

### CR-03: `RESTORE` action accepts untrusted sessionStorage payload without runtime validation

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:114-122, 140-152`
**Severity:** BLOCKER

**Issue:** The mount-time effect reads `sessionStorage`, `JSON.parse`s it, and dispatches the result as `RESTORE` with `payload: parsed`. The reducer spreads it directly into state:

```tsx
case 'RESTORE':
  return {
    ...state,
    ...action.payload,
    isSubmitting: false,
    bookingId: null,
    errors: {},
  }
```

There is no shape validation. If a user (or a script in the same origin, e.g., another tab on the same domain) writes garbage to `sessionStorage.setItem('booking:<eventId>', ...)`, the parsed value is merged into state. Concrete failure modes:

- `pax: "5"` (string) — passes JSON.parse, breaks `state.pax * event.price_per_seat` in StepParty (NaN), Zod rejects on submit.
- `pax: 99` — exceeds seatsLeft and `paxOptions` (which caps at `min(8, seatsLeft)`). Renders `<Select value="99">` with no matching option (controlled-component warning). User can submit, RPC rejects with confusing seat-shortage error.
- `guestDetails: null` or `[]` — `state.guestDetails.map(...)` in StepDietary/StepReview throws `TypeError: Cannot read properties of null`.
- `step: 7` — out-of-range, no step renders, user is stranded on a blank screen.
- `wineOptIn: true, winePairingCount: 999` — submits invalid data.
- Persisted state from a different `event.id` (if SESSION_KEY collides during dev) — pax may exceed the new event's seatsLeft.

Same-origin sessionStorage is shared across tabs and not authenticated; never trust it without runtime parsing.

**Fix:** Validate the parsed payload with Zod before dispatching. Also guard against `pax > seatsLeft` and `step` out of range:

```tsx
const restoreSchema = z.object({
  step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  pax: z.number().int().min(1).max(seatsLeft),
  wineOptIn: z.boolean(),
  winePairingCount: z.number().int().min(0),
  guestDetails: z.array(guestDetailSchema),
}).partial()

useEffect(() => {
  const saved = sessionStorage.getItem(SESSION_KEY)
  if (!saved) return
  try {
    const parsed = restoreSchema.safeParse(JSON.parse(saved))
    if (!parsed.success) {
      sessionStorage.removeItem(SESSION_KEY)
      return
    }
    // Also clamp pax/winePairingCount and resize guestDetails to match
    const safePax = Math.min(parsed.data.pax ?? INITIAL_PAX, seatsLeft)
    dispatch({ type: 'RESTORE', payload: {
      ...parsed.data,
      pax: safePax,
      guestDetails: resizeGuestDetails(parsed.data.guestDetails ?? [], safePax),
      winePairingCount: Math.min(parsed.data.winePairingCount ?? 0, safePax),
    }})
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
  }
}, [seatsLeft, SESSION_KEY])
```

---

### CR-04: `state.pax` can exceed `seatsLeft`, causing controlled-select desync and ghost guest cards

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:44-51`, `src/app/(guest)/book/[eventId]/StepParty.tsx:65-69`
**Severity:** BLOCKER

**Issue:** `INITIAL_PAX = 2` but the page-level guard only checks `seatsLeft === 0`. If an event has exactly 1 seat left:

- `seatsLeft = 1`, page renders `<BookingForm seatsLeft={1} />` (not sold out).
- `initialState.pax = 2` and `initialState.guestDetails` has 2 entries.
- `StepParty` computes `maxPax = Math.max(1, Math.min(8, 1)) = 1`, generates `paxOptions = [{ value: '1' }]`.
- `<Select value={String(state.pax)}>` is `value="2"` — no matching option. React logs a warning; in most browsers the select displays the first option ("1") but state.pax stays at 2.
- StepDietary renders 2 guest cards.
- StepReview computes price for 2 guests.
- User clicks Confirm, RPC rejects with "Not enough seats available. Requested: 2, Available: 1" — but the UI clearly showed "1 guest" in the dropdown.

**Fix:** Clamp the initial pax to `seatsLeft` when constructing the reducer's initial state:

```tsx
export default function BookingForm({ event, seatsLeft }: BookingFormProps) {
  const initialPax = Math.min(INITIAL_PAX, seatsLeft)
  const [state, dispatch] = useReducer(bookingReducer, {
    ...initialState,
    pax: initialPax,
    guestDetails: Array.from({ length: initialPax }, blankGuest),
  })
  // ...
}
```

Also, the `SET_PAX` reducer should ideally clamp to `seatsLeft` too, but the reducer has no access to it. Either (a) plumb `seatsLeft` through actions, or (b) clamp at dispatch site in StepParty.

---

## Warnings

### WR-01: `startTransition` wrapping an async function — should be `useTransition`

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:171-190`

**Issue:** `startTransition(async () => { ... })` runs in React 19 but it's the lower-level form. The hook `useTransition` returns an `isPending` boolean that gives a more reliable submission state than the manually managed `state.isSubmitting`. More importantly, if the user clicks Confirm twice quickly between `dispatch({ type: 'SUBMIT' })` and the next render, the second click will re-enter (the `if (state.isSubmitting) return` guard reads stale state from the closure — `state` is captured from the render that produced this `handleConfirm`, so the second click reads `isSubmitting=false` until a re-render happens).

**Fix:** Use `useTransition`:

```tsx
const [isPending, startTransition] = useTransition()
// ...
function handleConfirm() {
  if (isPending) return
  startTransition(async () => {
    const result = await submitBooking({ ... })
    // ...
  })
}
```

Or guard via a ref (`submittingRef.current`) which doesn't get captured stale.

---

### WR-02: Phone field is required in UI but optional in validator

**File:** `src/app/(guest)/book/[eventId]/StepContact.tsx:50-60`, `src/lib/validators.ts:16`

**Issue:** `<Input ... required>` for phone, but `bookingSchema` has `guestPhone: z.string().optional()` and `actions.ts` sends `guestPhone: parsed.data.guestPhone ?? ''`. Either the UI is wrong or the validator is wrong. If phone is operationally required (it likely is, since events use it for day-of contact), the validator should require non-empty.

**Fix:** Add `min(1)` (and ideally a Singapore phone regex) to `bookingSchema.guestPhone`, and remove the `?? ''` fallback in `actions.ts` — empty string for a "required for ops" field shouldn't silently succeed.

---

### WR-03: `SET_GUEST_DETAIL` action's `value` type allows invalid severity strings

**File:** `src/app/(guest)/book/[eventId]/StepParty.tsx:37-42`, `src/app/(guest)/book/[eventId]/StepDietary.tsx:151-164`

**Issue:** The action is typed:

```ts
| { type: 'SET_GUEST_DETAIL'; index: number; field: keyof GuestDetail; value: string | string[] }
```

Then the StepDietary severity `<Select>` dispatches `value: e.target.value` (untyped string). The reducer just spreads it into `guestDetails[i][field]`. A user who tampers with the DOM (changes the option value via devtools) can set `severity: "haha"` — the Zod schema catches it on submit, but until then `StepReview` reads `SEVERITY_LABELS[guest.severity]` which returns `undefined` and renders an empty Badge.

**Fix:** Narrow the action union, e.g.:

```ts
| { type: 'SET_GUEST_DETAIL'; index: number; field: 'guest_name' | 'other_allergies' | 'special_requests'; value: string }
| { type: 'SET_GUEST_DETAIL'; index: number; field: 'allergies' | 'dietary_restrictions'; value: string[] }
| { type: 'SET_GUEST_DETAIL'; index: number; field: 'severity'; value: GuestDetail['severity'] }
```

And cast/validate severity at the dispatch site.

---

### WR-04: `GO_TO_STEP` lets user skip forward past unfilled steps

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:102-103`, `src/app/(guest)/book/[eventId]/StepReview.tsx:66-90`

**Issue:** The Edit buttons in StepReview dispatch `GO_TO_STEP` to jump back, which is fine. But the action accepts any `1 | 2 | 3 | 4` and the reducer doesn't enforce that the user has actually completed prior steps. Combined with CR-02, this means StepReview itself becomes reachable without filling in dietary or contact — if the user navigates to `/book/<eventId>` and then somehow dispatches `GO_TO_STEP` (e.g., via React DevTools, or in the future via deep-linking), they land on a Confirm screen with empty data.

**Fix:** Either (a) only allow `GO_TO_STEP` to navigate to a step ≤ the highest completed step (track in state), or (b) validate the entire form on Confirm regardless of step.

---

### WR-05: Stale `seatsLeft` from ISR — UI shows seat count that may be wrong by up to 60s

**File:** `src/app/(guest)/book/[eventId]/page.tsx:7, 30`

**Issue:** `export const revalidate = 60` plus computing `seatsLeft = event.total_seats - event.booked_seats` server-side and passing it to a client component means the seat count is up to 60 seconds stale. The pax dropdown caps at this stale value, so a user could load a page showing "8 seats left", spend 30 seconds filling the form, and submit while only 1 seat remains — RPC will reject with a confusing message.

The atomicity is fine (server enforces), but UX would be much better with one of:
1. `revalidate = 0` (no caching) for the booking page only.
2. A client-side fetch on mount to refresh seatsLeft.
3. A live query/subscription (overkill for v1).

**Fix:** Set `export const revalidate = 0` (or even `dynamic = 'force-dynamic'`) on the booking page. The events listing can stay cached.

---

### WR-06: `bookingId.slice(0, 8)` reference code is not unique enough

**File:** `src/app/(guest)/book/[eventId]/BookingSuccess.tsx:21`

**Issue:** Taking the first 8 hex chars of a UUID gives roughly 32 bits of entropy. With even moderate booking volume, two bookings could share the same 8-char prefix; if a user calls in with their reference code, ops cannot uniquely identify the booking. Worse, UUIDv4 prefix is not even guaranteed unique within a single event.

**Fix:** Use the full UUID (or last 8 chars), or generate a separate human-readable reference column server-side (e.g., `PAL-2026-XXXX`). At minimum, display the full UUID so support can look it up.

---

### WR-07: Booking RPC's email upsert silently overwrites existing guest names/phones

**File:** `supabase/migrations/003_functions.sql:48-53` (referenced by `actions.ts`)

**Issue:** The `create_booking` RPC does:
```sql
INSERT INTO guests (name, email, phone)
VALUES (...)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = COALESCE(EXCLUDED.phone, guests.phone);
```

If two different people share an email (e.g., a household), the second booking overwrites the first guest's name. In Phase 1 this might be the intended pattern (one guest record per email), but the coupling between contact-email-as-identity and the booking-form contact field is implicit and undocumented. A user booking on behalf of a colleague could overwrite their own profile.

**Fix:** Either document this as the intended identity model, or namespace bookings by both email and an additional unique key. Out of scope for the front-end fix, but flag for the next phase.

---

### WR-08: `useEffect` dependency arrays disabled with eslint-disable — RESTORE/save logic depends on `SESSION_KEY`

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:151-152, 168-169`

**Issue:** Both effects disable `react-hooks/exhaustive-deps`. The mount effect (`[]`) is intentional, but `SESSION_KEY` derived from `event.id` *is* a real dependency: if `event.id` ever changes (e.g., during dev with HMR or routing remount), the saved key will lag. The save effect (`[state]`) writes to a key that depends on `event.id` — currently this is fine because the component always remounts when `event.id` changes, but it's a fragile assumption.

**Fix:** Move `SESSION_KEY` outside the effect and include it in deps explicitly, or wrap with `useMemo`. Wider fix: include `seatsLeft` in the restore effect's deps once it's used to clamp restored state (CR-03 fix).

---

## Info

### IN-01: `SESSION_KEY` recomputed on every render

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:136`

**Issue:** `const SESSION_KEY = \`booking:${event.id}\`` is a string concat on every render. Trivial cost, but not idiomatic. Wrap with `useMemo` or compute once outside the function (since `event.id` doesn't change for the component's lifetime, an inline `useRef` is also fine).

**Fix:** `const SESSION_KEY = useMemo(() => \`booking:${event.id}\`, [event.id])`.

---

### IN-02: `_contact` rename to silence eslint is ugly

**File:** `src/app/(guest)/book/[eventId]/BookingForm.tsx:161-162`

**Issue:** `const { contact: _contact, ...nonPii } = state` with eslint-disable comment is a workaround for `no-unused-vars`. Cleaner: just spread and delete, or build the object explicitly.

**Fix:**
```ts
const { contact, ...nonPii } = state
void contact // explicitly ignore
sessionStorage.setItem(SESSION_KEY, JSON.stringify(nonPii))
```
Or:
```ts
const { errors, isSubmitting, bookingId, contact, ...nonPii } = state
sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...nonPii }))
```

(Note: errors/isSubmitting/bookingId are already excluded on RESTORE, but they're still serialized here. Worth excluding to keep storage payload minimal.)

---

### IN-03: `validators.ts` allows `pax: 16` but UI caps at 8

**File:** `src/lib/validators.ts:17`, `src/app/(guest)/book/[eventId]/StepParty.tsx:65`

**Issue:** `bookingSchema.pax` is `z.number().int().min(1).max(16)` but the UI caps party size at `Math.min(8, seatsLeft)`. The validator's max 16 doesn't match any visible business rule and likely came from a different intent. Pick one source of truth (likely max should align with the largest event capacity, i.e., 30 from `eventSchema.total_seats`, or the per-booking party cap if there is one).

**Fix:** Document the intended max party size in a constant and use it in both places.

---

### IN-04: No max length on free-text fields

**File:** `src/lib/validators.ts:3-10`, all step files

**Issue:** `guest_name`, `other_allergies`, `special_requests`, `contact.name`, `contact.email` have no max-length validation. A malicious or careless user can submit a 10,000-char string for `special_requests` and bloat the database. RPC has no length cap either.

**Fix:** Add `.max(N)` to each string field in `validators.ts` (e.g., 100 for names, 500 for free text, 254 for email per RFC 5321). Match DB column constraints.

---

### IN-05: `wine_price ?? 0` means broken data renders silently as $0

**File:** `src/app/(guest)/book/[eventId]/StepParty.tsx:113-114, 145-146`

**Issue:** When `event.wine_pairing === true` but `event.wine_price === null` (data integrity issue from event creation), the UI renders "Add wine pairing ($0.00/person)". Better to either hide the wine option entirely or show a clear "wine pairing unavailable" message.

**Fix:**
```tsx
{event.wine_pairing && event.wine_price && event.wine_price > 0 && (
  // ... wine UI
)}
```

---

_Reviewed: 2026-05-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
