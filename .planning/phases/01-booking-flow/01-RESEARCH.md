# Phase 1: Booking Flow — Research

**Researched:** 2026-04-25
**Domain:** Next.js 16 App Router · React 19 · Supabase JS v2 · Tailwind v4
**Confidence:** HIGH

---

## Summary

Phase 1 wires the `/book/[eventId]` route that already has a dead link on the event detail page. All backend infrastructure is complete — the `create_booking` PostgreSQL function (with row-level locking), full DB schema, Zod validators, Supabase clients, and UI atom library are ready. The work is entirely frontend: a 4-step client-component wizard using `useReducer`, a server action that calls the RPC, and sessionStorage persistence for non-PII fields.

The form is a client-driven multi-step wizard, not a simple `<form action>` submission. This means the final submission uses an event-handler invocation of the server action (via `startTransition` or direct `await`) rather than the React progressive-enhancement form pattern. The `useReducer` approach is a locked decision from STATE.md — it manages step navigation, field values, validation errors, and `isSubmitting` state in one place.

The booking route is a guest-facing unauthenticated page. The `create_booking` RPC uses `SECURITY DEFINER` and is called via the **anon** Supabase client (RLS policies in `002_rls_policies.sql` permit public INSERT into bookings, guests, and guest_details). No `requireAuth()` needed.

**Primary recommendation:** Build `src/app/(guest)/book/[eventId]/` as a server component wrapper (fetches event data at 60s ISR) that renders a `'use client'` `BookingForm` component. The server action lives in a colocated `actions.ts` and is invoked from the client via an onClick handler wrapped in `startTransition`.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 1 |
|-----------|------------------|
| No ORM — Supabase JS client only | RPC call uses `supabase.rpc('create_booking', {...})` |
| Two client factories: `server.ts` (anon/read) and `admin.ts` (service-role/mutations) | Booking submission calls the **anon** client — RPC is `SECURITY DEFINER`, no service-role needed |
| Server actions pattern: `requireAuth()` → Zod → `createAdminClient()` → revalidate → redirect | Booking action skips `requireAuth()` (guest-facing); uses anon client to call RPC |
| Tailwind v4 with `@theme inline` CSS variables | Use existing `bg-burgundy-700`, `text-cream-50` etc. utility classes directly — no config changes needed |
| Custom UI atoms in `src/components/ui/` — no component library | Compose from `Button`, `Input`, `Select`, `Badge`; new `StepIndicator` is pure HTML/Tailwind |
| `params` is a `Promise<{...}>` in Next.js 15+; must be `await`ed | `const { eventId } = await params` in the server page component |
| Read AGENTS.md: Next.js local docs in `node_modules/next/dist/docs/` supersede training data | Verified Next.js 16.2.2 conventions below |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Event data fetch (ISR 60s) | Frontend Server (SSR) | — | `export const revalidate = 60` on the page; `createClient()` server-side read |
| Seat availability display | Frontend Server (SSR) | Client (derived state) | `seatsLeft` computed server-side, passed as prop; client gates party-size Select options |
| Multi-step form state | Browser / Client | — | `useReducer` in `'use client'` component; no server round-trips between steps |
| Form validation | Browser / Client | API / Backend | Client validates on NEXT_STEP dispatch; server action re-validates with existing Zod schema before RPC call |
| Booking submission (RPC) | API / Backend | — | `create_booking` PostgreSQL function with `FOR UPDATE` row lock — atomicity lives in the DB |
| Double-submit prevention | Browser / Client | API / Backend | `isSubmitting` flag in reducer (client); DB `FOR UPDATE` lock (server) is the safety net |
| sessionStorage persistence | Browser / Client | — | Pure client-side; no server involvement |
| Success state / redirect | Browser / Client | — | On successful RPC response, replace step content with success view (no server redirect needed) |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BOOK-01 | Guest can select party size and wine pairing count on step 1 | `Select` atom for pax (1..min(8,seatsLeft)); native checkbox + `Select` for wine count |
| BOOK-02 | Guest can enter allergy/dietary info for each person on step 2 | One `<fieldset>` per pax rendered from reducer `guestDetails[]` array |
| BOOK-03 | Guest can enter contact details (name, email, phone) on step 3 | Three `Input` atoms; `autocomplete` attributes as per UI-SPEC |
| BOOK-04 | Guest can review booking summary and confirm on step 4 | Read-only summary from reducer state; "edit" links dispatch `GO_TO_STEP` action |
| BOOK-05 | Booking atomically reserves seats via `create_booking` RPC | `supabase.rpc('create_booking', payload)` — RPC already exists in `004_cancel_booking_and_fixes.sql` (latest version) |
| BOOK-06 | Form shows live seat availability and prevents overbooking | `seatsLeft` from ISR server component; sold-out check on mount; RPC raises exception if seats gone |
| BOOK-07 | Submit button disabled during submission, no double-submit | `isSubmitting` in reducer; `startTransition` + direct `await` pattern for server action call |
| BOOK-08 | Form progress persists to sessionStorage across page refreshes | `useEffect` on state change serializes non-PII fields; mount effect restores; clear on success |
</phase_requirements>

---

## Standard Stack

### Core (already installed — verified in package.json)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| next | 16.2.2 | Framework | [VERIFIED: package.json] |
| react | 19.2.4 | UI runtime | [VERIFIED: package.json] — `useReducer`, `startTransition`, `useActionState` all available |
| @supabase/supabase-js | ^2.101.1 | DB client | [VERIFIED: package.json] — `.rpc()` method used for booking |
| @supabase/ssr | ^0.10.0 | Server-side Supabase client | [VERIFIED: package.json] |
| zod | ^4.3.6 | Validation | [VERIFIED: package.json] — `bookingSchema` and `guestDetailSchema` already exist in `src/lib/validators.ts` |
| lucide-react | ^1.7.0 | Icons | [VERIFIED: package.json] — spinner, checkmark, arrow icons |
| tailwindcss | ^4 | Styling | [VERIFIED: package.json] — Tailwind v4 with `@theme inline` CSS variables |

### No New Dependencies Required

All libraries needed for Phase 1 are already installed. No `npm install` step needed.

---

## Architecture Patterns

### System Architecture Diagram

```
Event Detail Page (/events/[slug])
  └── "Reserve Your Seat" link → /book/[eventId]

/book/[eventId]/page.tsx  (Server Component, revalidate=60)
  ├── Fetch: supabase.from('events').select('*').eq('id', eventId)
  ├── Guard: if sold_out → render SoldOutState
  └── Render: <BookingForm event={event} seatsLeft={seatsLeft} />

BookingForm ('use client')
  ├── useReducer(bookingReducer, initialState)
  ├── useEffect: sessionStorage restore on mount
  ├── useEffect: sessionStorage save on state change
  │
  ├── Step 1: <StepParty>    — pax Select, wine checkbox/Select, price summary
  ├── Step 2: <StepDietary>  — N fieldsets (one per guest in guestDetails[])
  ├── Step 3: <StepContact>  — name/email/phone Inputs
  ├── Step 4: <StepReview>   — read-only summary + "Confirm Booking" button
  │
  ├── On CONFIRM dispatch:
  │     startTransition(async () => {
  │       const result = await submitBooking(payload)  // server action
  │       if (result.error) dispatch({ type: 'SET_ERROR', error: result.error })
  │       else dispatch({ type: 'SET_SUCCESS', bookingId: result.bookingId })
  │     })
  │
  └── Success State: <BookingSuccess bookingId={...} event={event} />

/book/[eventId]/actions.ts  ('use server')
  └── submitBooking(payload):
        1. Zod validate (bookingSchema)
        2. createClient() [anon — RPC is SECURITY DEFINER]
        3. supabase.rpc('create_booking', {...})
        4. Return { bookingId } or { error: string }
        (NO redirect — client handles success state transition)
```

### Recommended File Structure

```
src/app/(guest)/book/
└── [eventId]/
    ├── page.tsx           # Server component — event fetch, ISR, sold-out guard
    ├── actions.ts         # 'use server' — submitBooking()
    ├── BookingForm.tsx    # 'use client' — useReducer, 4 steps, sessionStorage
    ├── StepIndicator.tsx  # Pure presentational (no state)
    ├── StepParty.tsx      # Step 1 content
    ├── StepDietary.tsx    # Step 2 content
    ├── StepContact.tsx    # Step 3 content
    ├── StepReview.tsx     # Step 4 content
    └── BookingSuccess.tsx # Post-submission success state
```

### Pattern 1: Server Component Page Wrapper + Client Form

The page fetches server-side (ISR 60s) and passes static event data as props to the client form. The client form never re-fetches event data — it uses the prop values throughout.

```tsx
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
// src/app/(guest)/book/[eventId]/page.tsx

export const revalidate = 60

type PageProps = { params: Promise<{ eventId: string }> }

export default async function BookPage({ params }: PageProps) {
  const { eventId } = await params          // params is a Promise in Next.js 15+
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .in('status', ['published', 'sold_out'])
    .single()

  if (!event) notFound()

  const seatsLeft = event.total_seats - event.booked_seats
  if (event.status === 'sold_out' || seatsLeft === 0) {
    return <SoldOutState event={event} />
  }

  return <BookingForm event={event} seatsLeft={seatsLeft} />
}
```

### Pattern 2: useReducer Form State

The reducer manages all mutable form state. Actions include `SET_PAX`, `SET_WINE_OPT_IN`, `SET_WINE_COUNT`, `SET_GUEST_DETAIL`, `SET_CONTACT`, `NEXT_STEP`, `PREV_STEP`, `GO_TO_STEP`, `SUBMIT`, `SET_ERROR`, `SET_SUCCESS`.

```ts
// Source: STATE.md locked decision + UI-SPEC interaction contracts
type FormState = {
  step: 1 | 2 | 3 | 4
  pax: number
  wineOptIn: boolean
  winePairingCount: number
  guestDetails: GuestDetail[]
  contact: { name: string; email: string; phone: string }
  errors: Record<string, string>
  isSubmitting: boolean
  bookingId: string | null  // set on success
}
```

### Pattern 3: Server Action for Guest Booking (anon client, no requireAuth)

The booking action differs from admin actions: it uses the **anon client** (not `createAdminClient()`) because `create_booking` is `SECURITY DEFINER` and RLS permits public INSERT. No `requireAuth()`.

```ts
// Source: verified from 002_rls_policies.sql + 004_cancel_booking_and_fixes.sql
// src/app/(guest)/book/[eventId]/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { bookingSchema } from '@/lib/validators'

export async function submitBooking(payload: unknown) {
  const parsed = bookingSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: 'Invalid booking data' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_booking', {
    p_event_id: parsed.data.eventId,
    p_guest_name: parsed.data.guestName,
    p_guest_email: parsed.data.guestEmail,
    p_guest_phone: parsed.data.guestPhone ?? '',
    p_pax: parsed.data.pax,
    p_wine_pairing_count: parsed.data.winePairingCount,
    p_guest_details: parsed.data.guestDetails,
  })

  if (error) return { error: mapRpcError(error.message) }
  return { bookingId: data as string }
}
```

### Pattern 4: Invoking Server Action from Client Event Handler

The booking form uses an event handler (not `<form action>`) because it collects complex state over 4 steps and only submits at the final step. Use `startTransition` to wrap the async call so React can track the pending state.

```tsx
// Source: node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md
// "Event Handlers" section + "Showing a pending state" section
import { startTransition } from 'react'
import { submitBooking } from './actions'

function handleConfirm() {
  dispatch({ type: 'SUBMIT' })
  startTransition(async () => {
    const result = await submitBooking(buildPayload(state))
    if (result.error) {
      dispatch({ type: 'SET_ERROR', error: result.error })
    } else {
      dispatch({ type: 'SET_SUCCESS', bookingId: result.bookingId })
    }
  })
}
```

**Important:** `redirect()` must NOT be called inside this server action. The client dispatches `SET_SUCCESS` and renders the success state directly — a server redirect would lose the `bookingId` needed for the confirmation display.

### Pattern 5: sessionStorage Persistence

```tsx
// Source: UI-SPEC interaction contracts (BOOK-08)
const SESSION_KEY = `booking:${event.id}`

// Restore on mount
useEffect(() => {
  const saved = sessionStorage.getItem(SESSION_KEY)
  if (saved) {
    const parsed = JSON.parse(saved)
    dispatch({ type: 'RESTORE', payload: parsed })
  }
}, [])

// Save on every non-PII state change
useEffect(() => {
  if (state.bookingId) {
    sessionStorage.removeItem(SESSION_KEY)  // clear on success
    return
  }
  const { contact: _contact, ...nonPii } = state
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(nonPii))
}, [state])
```

### Anti-Patterns to Avoid

- **Calling `redirect()` in the booking server action:** The success view needs the `bookingId` UUID from the RPC return value. A server redirect would lose this. Return `{ bookingId }` instead and let the client render the success state.
- **Using `createAdminClient()` for the booking action:** The RPC is `SECURITY DEFINER` — it runs as the DB owner regardless of calling role. The anon client is correct. Using service-role here is unnecessary and expands attack surface.
- **Calling `requireAuth()` for the booking submission:** This is a guest-facing action. Authentication is not applicable.
- **Fetching event data from the client component:** Pass `event` as a prop from the server component. ISR handles freshness. A client fetch adds latency and complexity.
- **Using `useFormStatus` for the submit button:** `useFormStatus` only works inside a `<form>` with an `action` prop. Since the booking form uses an event-handler submission, track `isSubmitting` in the reducer instead.
- **Not awaiting `params`:** In Next.js 15+, `params` is a `Promise`. Synchronous access works as a compatibility shim but will be removed. Always `await params`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic seat reservation | Custom optimistic lock in JS | `create_booking` PostgreSQL function (already exists) | DB-level `FOR UPDATE` row lock is the only way to prevent race conditions across concurrent requests |
| Input validation schema | Custom validation logic | Existing `bookingSchema` + `guestDetailSchema` in `src/lib/validators.ts` | Already covers all booking fields including the `guestDetails.length === pax` refinement |
| Currency formatting | `toLocaleString` calls inline | `formatCurrency()` in `src/lib/utils.ts` | Already configured for SGD with correct `en-SG` locale |
| Seat status badges | Inline conditional rendering | `Badge` atom + `getSeatsStatus()` in `src/lib/utils.ts` | Consistent with event detail page; thresholds already defined |
| Date/time formatting | Manual format strings | `formatDate()` / `formatTime()` in `src/lib/utils.ts` | Consistent display across pages |

---

## Common Pitfalls

### Pitfall 1: RPC Error Message Leaks DB Internals

**What goes wrong:** The `create_booking` RPC raises exceptions with messages like `"Not enough seats available. Requested: 4, Available: 2"`. If the raw `error.message` is forwarded to the client, it exposes schema details and looks unprofessional.

**Why it happens:** Supabase surfaces PostgreSQL `RAISE EXCEPTION` messages verbatim in `error.message`.

**How to avoid:** Map known RPC error substrings to user-friendly copy in a `mapRpcError(msg: string): string` helper in `actions.ts`. Match on:
- `'Not enough seats available'` → UI-SPEC copy: `"Sorry, those seats were just taken. Only {N} seat(s) remain."`
- `'not accepting bookings'` → `"This event is no longer accepting bookings."`
- `'Booking deadline has passed'` → `"The booking deadline for this event has passed."`
- Fallback → `"Something went wrong. Please try again."`

**Warning signs:** Error banner shows PostgreSQL exception text.

### Pitfall 2: sessionStorage Key Collision Between Events

**What goes wrong:** If a guest navigates to two different event booking pages in the same browser session, both write to the same sessionStorage key and step/pax data from one event overwrites the other.

**Why it happens:** Using a generic key like `"booking_form"` instead of scoping per event.

**How to avoid:** Key on event ID: `booking:${event.id}`. The UI-SPEC already specifies this pattern.

### Pitfall 3: guestDetails Array Out of Sync with pax

**What goes wrong:** The RPC has a Zod refinement `guestDetails.length === pax`. If `pax` changes after guestDetails have been partially filled (e.g., user goes back to step 1 and reduces pax), the array may be longer than pax, causing validation failure.

**Why it happens:** Reducing pax doesn't automatically trim `guestDetails`.

**How to avoid:** On `SET_PAX` dispatch in the reducer, resize `guestDetails` to match the new pax: trim excess entries if reducing, append blank entries if increasing.

### Pitfall 4: Stale seatsLeft Prop After ISR

**What goes wrong:** Page loads with `seatsLeft = 3`. Guest fills all 4 steps, selects pax=3, submits — but in the 60-second ISR window another booking took the seats. The `Select` max still showed 3 as available.

**Why it happens:** ISR means the server-rendered prop may be up to 60s stale.

**How to avoid:** This is the expected behavior — the RPC's `FOR UPDATE` lock is the real guard. When the RPC returns a seat error, display the inline error banner with updated count. The UI-SPEC already specifies the error copy for this case. Do NOT attempt real-time seat polling; it's explicitly out of scope.

### Pitfall 5: Wine Pairing Count Exceeds pax After pax Reduction

**What goes wrong:** Guest selects pax=4, winePairingCount=3. Goes back to step 1, reduces pax=2. Now winePairingCount > pax, failing the Zod refinement.

**Why it happens:** Changing pax doesn't automatically adjust winePairingCount.

**How to avoid:** On `SET_PAX` dispatch, clamp `winePairingCount = Math.min(state.winePairingCount, newPax)`.

### Pitfall 6: redirect() Inside try/catch

**What goes wrong:** In admin actions the pattern is `redirect()` after mutation. If wrapped in try/catch, `redirect()` throws an internal Next.js error that gets caught.

**Why it happens:** `redirect()` uses thrown errors internally in Next.js.

**How to avoid:** Not applicable to Phase 1 (booking action returns data, doesn't call redirect). But note: all existing admin actions correctly call `redirect()` outside try/catch.

---

## Code Examples

### RPC Parameter Mapping (create_booking)

```ts
// Source: verified from 004_cancel_booking_and_fixes.sql (latest migration)
// RPC signature:
// create_booking(p_event_id, p_guest_name, p_guest_email, p_guest_phone,
//                p_pax, p_wine_pairing_count, p_guest_details JSONB)
// Returns: UUID (booking id)

const { data: bookingId, error } = await supabase.rpc('create_booking', {
  p_event_id: eventId,
  p_guest_name: contact.name,
  p_guest_email: contact.email,
  p_guest_phone: contact.phone,
  p_pax: pax,
  p_wine_pairing_count: winePairingCount,
  p_guest_details: guestDetails,  // JSONB array — JS objects serialize automatically
})
```

### Zod Schema Already Available

```ts
// Source: verified from src/lib/validators.ts
// guestDetailSchema and bookingSchema cover all Phase 1 fields.
// bookingSchema has two .refine() checks:
//   1. guestDetails.length === pax
//   2. winePairingCount <= pax
// These are the exact guards needed.
import { bookingSchema, guestDetailSchema } from '@/lib/validators'
```

### Step Indicator (HTML/Tailwind, no new component needed)

```tsx
// Source: UI-SPEC component inventory
// 4 dots + connecting track, Tailwind v4 with existing brand tokens
const STEPS = ['Party', 'Dietary', 'Contact', 'Review']

function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav aria-label="Booking progress" className="flex items-center gap-0 w-full">
      {STEPS.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                ${done || active ? 'bg-burgundy-700 text-white' : 'bg-cream-300 text-burgundy-400'}`}
              >
                {done ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`text-xs mt-1 ${active ? 'text-burgundy-900' : 'text-burgundy-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-burgundy-700' : 'bg-cream-300'}`} />
            )}
          </div>
        )
      })}
    </nav>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params` as sync prop | `params` as `Promise<{...}>` | Next.js 15 | Must `await params` in server page components |
| `useFormState` (React 18 era) | `useActionState` (React 19) | React 19 / Next.js 15 | Use `useActionState` not `useFormState` |
| `next/router` (Pages Router) | `next/navigation` (`useRouter`) | App Router | Import from `next/navigation` |

**Deprecated/outdated in this codebase:**
- `useFormState` from `react-dom`: replaced by `useActionState` from `react`. Not applicable here (form uses useReducer, not useActionState), but worth knowing.

---

## Environment Availability

Step 2.6: The phase is purely frontend code + existing Supabase. No new external dependencies.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase local | BOOK-05 (RPC) | Check with `supabase status` | — | Remote Supabase project |
| Node.js | Build/dev | ✓ | v25.9.0 | — |

All npm packages are already installed. No new installs needed.

---

## Validation Architecture

### Test Framework

No test suite is configured (confirmed in CLAUDE.md: "No test suite is configured"). `nyquist_validation` is enabled in config.json but no test runner exists.

| Property | Value |
|----------|-------|
| Framework | None configured |
| Config file | None |
| Quick run command | `npm run build` (type-check + lint as proxy) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOK-01 | Pax/wine step renders with correct Select options | manual | — | — |
| BOOK-02 | Dietary fieldsets render N times (one per pax) | manual | — | — |
| BOOK-03 | Contact validation rejects bad email | manual | — | — |
| BOOK-04 | Review step shows all form data | manual | — | — |
| BOOK-05 | RPC called with correct payload on confirm | manual | — | — |
| BOOK-06 | Sold-out guard hides form | manual | — | — |
| BOOK-07 | Confirm button disables during submission | manual | — | — |
| BOOK-08 | Page refresh restores non-PII fields | manual | — | — |

### Wave 0 Gaps

No test infrastructure exists. All verification is manual. This matches the `nyquist_validation: true` config with no test runner — the planner should note that Wave 0 has no test file creation gap, but verification steps must be manual browser checks.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Guest-facing, no auth required |
| V3 Session Management | no | No session created for guests |
| V4 Access Control | partial | RLS policies restrict guest writes to the RPC path; `SECURITY DEFINER` ensures DB-level enforcement |
| V5 Input Validation | yes | Zod `bookingSchema` + `guestDetailSchema` in server action before RPC call |
| V6 Cryptography | no | No cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Overbooking via concurrent requests | Tampering | PostgreSQL `FOR UPDATE` row lock in `create_booking` RPC |
| Submitting pax > seatsLeft | Tampering | RPC validates `booked_seats + p_pax <= total_seats` server-side |
| Invalid JSONB payload in guestDetails | Tampering | Zod validates array shape before RPC call; RPC casts severity enum |
| Spamming booking submissions | DoS | No rate limiting in scope (SEC-01 deferred to v2); DB lock prevents data corruption |
| RLS bypass on guests/bookings/guest_details tables | Elevation of Privilege | `WITH CHECK (true)` is intentionally permissive (SEC-01 deferred) — noted in STATE.md blockers |

**Note:** The open RLS INSERT policies (`WITH CHECK (true)`) are a known concern logged in STATE.md. They allow anonymous direct INSERT bypassing the RPC. This is a v2 security fix (SEC-01), not in scope for Phase 1.

---

## Open Questions

1. **Is the anon client cookie handling correct when called from a server action?**
   - What we know: `createClient()` in `server.ts` uses `cookies()` from `next/headers`. Server actions have access to the request cookies context.
   - What's unclear: Whether the anon key is sufficient for calling `SECURITY DEFINER` RPCs, or if the RPC requires explicit anon role.
   - Recommendation: The RLS policy `"Public can create bookings" WITH CHECK (true)` + the function's `SECURITY DEFINER` clause means the anon key works. No concern.

2. **Does `useTransition` / `startTransition` affect `isSubmitting` reducer state?**
   - What we know: `startTransition` marks updates as non-urgent but doesn't expose a pending boolean unless using `useTransition`. The reducer's `isSubmitting` flag is the source of truth for button disabled state.
   - Recommendation: Use `useTransition` to get the `isPending` boolean as a cross-check, or rely entirely on the reducer's `isSubmitting`. Either works; reducer approach is simpler and matches STATE.md decision.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The anon Supabase client can call `create_booking` RPC without service-role key because the function is `SECURITY DEFINER` | Architecture Patterns, Pattern 3 | If wrong, booking submission fails with a 403 — fix by switching to `createAdminClient()` in the server action |
| A2 | `supabase.rpc()` return type with the anon client correctly infers `data` as the UUID string returned by the PL/pgSQL function | Code Examples | If wrong, TypeScript error on `data as string` cast — fix is trivial: add explicit type assertion |

---

## Sources

### Primary (HIGH confidence)

- `node_modules/next/dist/docs/01-app/` — local Next.js 16.2.2 docs (forms, mutating-data, file-conventions, redirect, useRouter)
- `supabase/migrations/001_initial_schema.sql` — verified schema (events, bookings, guest_details, allergy_severity enum)
- `supabase/migrations/002_rls_policies.sql` — verified RLS policies (public INSERT with check true)
- `supabase/migrations/004_cancel_booking_and_fixes.sql` — latest `create_booking` RPC definition
- `src/lib/validators.ts` — verified Zod schemas (`bookingSchema`, `guestDetailSchema`)
- `src/components/ui/` — verified Button, Input, Select atom APIs
- `src/lib/utils.ts` — verified utility functions (`formatCurrency`, `getSeatsStatus`)
- `package.json` — verified all dependency versions
- `.planning/phases/01-booking-flow/01-UI-SPEC.md` — approved design contract (interaction contracts, component inventory, copywriting)
- `.planning/STATE.md` — locked decisions (useReducer, fire-and-forget email, ISR 60s)

### Secondary (MEDIUM confidence)

- AGENTS.md warning confirmed: docs read directly from `node_modules/next/dist/docs/` per instructions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json, all APIs verified in local Next.js docs
- Architecture: HIGH — server component pattern mirrors existing event detail page; RPC signature verified in migrations
- Pitfalls: HIGH — derived from direct code inspection of validators, RLS policies, and RPC logic
- Security: HIGH — RLS policies and RPC code read directly

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (stable stack)
