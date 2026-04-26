# Phase 1: Booking Flow - Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 9 new files
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/(guest)/book/[eventId]/page.tsx` | page (server component) | request-response | `src/app/(guest)/events/[slug]/page.tsx` | exact |
| `src/app/(guest)/book/[eventId]/actions.ts` | server action | request-response | `src/app/admin/events/actions.ts` | role-match (no requireAuth, anon client) |
| `src/app/(guest)/book/[eventId]/BookingForm.tsx` | client component | event-driven | `src/components/admin/EventForm.tsx` | partial (useReducer vs useActionState) |
| `src/app/(guest)/book/[eventId]/StepIndicator.tsx` | presentational component | — | `src/components/ui/Badge.tsx` | partial (Tailwind brand tokens only) |
| `src/app/(guest)/book/[eventId]/StepParty.tsx` | client component | event-driven | `src/components/admin/EventForm.tsx` (pricing/wine section) | role-match |
| `src/app/(guest)/book/[eventId]/StepDietary.tsx` | client component | event-driven | `src/components/admin/ReviewForm.tsx` | role-match |
| `src/app/(guest)/book/[eventId]/StepContact.tsx` | client component | event-driven | `src/components/admin/ReviewForm.tsx` | role-match |
| `src/app/(guest)/book/[eventId]/StepReview.tsx` | presentational component | — | `src/app/(guest)/events/[slug]/page.tsx` (summary sections) | partial |
| `src/app/(guest)/book/[eventId]/BookingSuccess.tsx` | presentational component | — | `src/app/(guest)/events/[slug]/page.tsx` (hero block) | partial |

---

## Pattern Assignments

### `src/app/(guest)/book/[eventId]/page.tsx` (server component, request-response)

**Analog:** `src/app/(guest)/events/[slug]/page.tsx`

**Imports pattern** (lines 1-8):
```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSeatsStatus } from '@/lib/utils'
import type { Database } from '@/types/database'
```

**ISR + params pattern** (lines 10-22):
```typescript
export const revalidate = 60

type PageProps = {
  params: Promise<{ slug: string }>   // slug → eventId; must be Promise<> in Next.js 15+
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params        // always await params
  const supabase = await createClient()
```

**Supabase read + notFound guard** (lines 24-38):
```typescript
  const { data: event, error } = await supabase
    .from('events')
    .select(`*, venue:venues(*), courses(*)`)
    .eq('slug', slug)
    .in('status', ['published', 'sold_out', 'completed'])
    .single()

  // PGRST116 = no rows returned; anything else is a real error
  if (error && error.code !== 'PGRST116') throw error
  if (!event) notFound()
```

**seatsLeft / sold-out derivation** (lines 46-48):
```typescript
  const seatsLeft = event.total_seats - event.booked_seats
  const seatStatus = getSeatsStatus(event.booked_seats, event.total_seats)
  const isSoldOut = seatStatus === 'sold_out'
```

**Adaptation notes:**
- Change `params` key from `slug` to `eventId`
- Query `.eq('id', eventId)` instead of `.eq('slug', slug)`
- Filter on `['published', 'sold_out']` only (no 'completed' — booking page rejects both cases)
- If `isSoldOut`, render `<SoldOutState event={event} />` instead of the body
- Pass `event` and `seatsLeft` as props to `<BookingForm />`

---

### `src/app/(guest)/book/[eventId]/actions.ts` (server action, request-response)

**Analog:** `src/app/admin/events/actions.ts`

**File header** (line 1):
```typescript
'use server'
```

**Imports pattern** (lines 1-8 of admin/events/actions.ts):
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'   // anon client — NOT admin
import { bookingSchema } from '@/lib/validators'
```

**Zod validate → early return pattern** (lines 60-64 of admin/events/actions.ts):
```typescript
  const parsed = eventSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }
```

**Supabase call + error return pattern** (lines 71-79):
```typescript
  const { data: event, error } = await db
    .from('events')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) {
    return { error: { _form: [error.message] } }
  }
```

**Adaptation notes for booking action (deviations from admin pattern):**
- NO `requireAuth()` call — this is a guest action
- Use `createClient()` (anon, `src/lib/supabase/server.ts`), NOT `createAdminClient()`
- Use `supabase.rpc('create_booking', {...})` instead of `.from().insert()`
- NO `revalidatePath()` or `redirect()` — return `{ bookingId: data as string }` or `{ error: string }`
- Add a `mapRpcError(msg: string): string` helper before the export to translate raw PostgreSQL RAISE EXCEPTION messages to user-friendly copy

**RPC call pattern** (from RESEARCH.md, verified against migrations):
```typescript
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
```

---

### `src/app/(guest)/book/[eventId]/BookingForm.tsx` (client component, event-driven)

**Analog:** `src/components/admin/EventForm.tsx`

**Client directive + imports pattern** (lines 1-9 of EventForm.tsx):
```typescript
'use client'

import { useActionState, useState } from 'react'
import type { Database } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
```

**Adaptation — swap `useActionState` for `useReducer` + `startTransition`:**
```typescript
'use client'

import { useReducer, useEffect, startTransition } from 'react'
import type { Database } from '@/types/database'
import Button from '@/components/ui/Button'
import { submitBooking } from './actions'
```

**Error banner pattern** (lines 44-48 of EventForm.tsx):
```typescript
      {errors?._form && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
          {errors._form.join(', ')}
        </div>
      )}
```

**Submit button disabled-during-pending pattern** (lines 231-235 of EventForm.tsx):
```typescript
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
```
For `BookingForm`, replace `isPending` with `state.isSubmitting` from the reducer.

**Form section/heading layout pattern** (lines 51-54 of EventForm.tsx):
```typescript
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-burgundy-900 border-b border-cream-300 pb-2">
          Event Details
        </h2>
```

**Adaptation notes:**
- `useReducer(bookingReducer, initialState)` replaces `useActionState`
- `isSubmitting` flag in reducer replaces `isPending` from `useActionState`
- `startTransition(async () => { const result = await submitBooking(...) })` replaces `<form action={formAction}>`
- Two `useEffect` hooks for sessionStorage restore (on mount) and save (on state change)
- Render one of four `<Step*>` components based on `state.step`

---

### `src/app/(guest)/book/[eventId]/StepIndicator.tsx` (presentational component)

**Analog:** `src/components/ui/Badge.tsx` (brand token usage only)

**Brand token usage pattern** (lines 9-16 of Badge.tsx):
```typescript
const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-cream-200 text-burgundy-700',
  success: 'bg-sage-100 text-sage-700',
  warning: 'bg-gold-100 text-gold-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}
```

**Active/done/pending color vocabulary:**
- Active step: `bg-burgundy-700 text-white`
- Completed step: `bg-burgundy-700 text-white` + `<Check />` icon from `lucide-react`
- Pending step: `bg-cream-300 text-burgundy-400`
- Active label: `text-burgundy-900`
- Pending label: `text-burgundy-400`
- Track filled: `bg-burgundy-700`
- Track empty: `bg-cream-300`

**Component prop shape:**
```typescript
interface StepIndicatorProps {
  current: 1 | 2 | 3 | 4
}
```
No internal state. Pure function component (no `forwardRef` needed).

---

### `src/app/(guest)/book/[eventId]/StepParty.tsx` (client component, event-driven)

**Analog:** `src/components/admin/EventForm.tsx` — pricing/wine section (lines 168-218)

**Select atom usage pattern** (lines 87-101 of EventForm.tsx — native select, same pattern as `Select` atom):
```typescript
          <select
            id="venue_id"
            name="venue_id"
            required
            defaultValue={event?.venue_id ?? ''}
            className="w-full px-3 py-2 border border-cream-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-burgundy-900 focus:border-transparent"
          >
```

**Checkbox + hidden input pattern** (lines 187-204 of EventForm.tsx):
```typescript
          <input
            type="hidden"
            name="wine_pairing"
            value={winePairing ? 'true' : 'false'}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={winePairing}
              onChange={(e) => setWinePairing(e.target.checked)}
              className="rounded border-cream-400 text-burgundy-900 focus:ring-burgundy-900"
            />
            <span className="text-sm font-medium text-burgundy-700">
              Offer wine pairing add-on
            </span>
          </label>
```

**Conditional field reveal pattern** (lines 206-218 of EventForm.tsx):
```typescript
        {winePairing && (
          <Input
            id="wine_price"
            ...
          />
        )}
```

**Currency display pattern** (from `src/app/(guest)/events/[slug]/page.tsx` lines 167-171):
```typescript
            <p className="text-white font-bold text-lg leading-tight">
              {formatCurrency(event.price_per_seat)}
              <span className="text-burgundy-300 text-sm font-normal ml-1">/person</span>
            </p>
```

**Adaptation notes:**
- Use `Select` atom from `src/components/ui/Select.tsx` for pax (options 1..min(8, seatsLeft))
- Dispatch `{ type: 'SET_PAX', pax: newValue }` on change — reducer must clamp `winePairingCount` and resize `guestDetails[]`
- Dispatch `{ type: 'SET_WINE_OPT_IN', value: bool }` on checkbox change
- Dispatch `{ type: 'SET_WINE_COUNT', count: n }` on wine count Select change (only rendered if `wineOptIn`)
- Use `formatCurrency()` from `src/lib/utils.ts` for price summary display

---

### `src/app/(guest)/book/[eventId]/StepDietary.tsx` (client component, event-driven)

**Analog:** `src/components/admin/ReviewForm.tsx`

**Input atom with error pattern** (lines 40-48 of ReviewForm.tsx):
```typescript
      <Input
        id="guest_name"
        name="guest_name"
        label="Guest Name / Initials"
        defaultValue={review?.guest_name ?? ''}
        required
        placeholder="e.g. A.K. or Sarah C."
        error={errors?.guest_name?.join(', ')}
      />
```

**Section heading pattern** (mirrors EventForm.tsx lines 51-54):
```typescript
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-burgundy-900 border-b border-cream-300 pb-2">
          ...
        </h2>
```

**Adaptation notes:**
- Render `state.guestDetails.length` fieldsets (one per guest), keyed by index
- Each fieldset maps to one `GuestDetail` entry in the reducer array
- Use `<fieldset>` with `<legend>` for semantic grouping: `Guest {i + 1}`
- Dispatch `{ type: 'SET_GUEST_DETAIL', index: i, field: key, value }` on input change
- Error path: `state.errors[`guestDetails.${i}.guest_name`]`
- Severity is an `<select>` with options from the `allergy_severity` enum: `preference | intolerance | life_threatening`
- Allergies/dietary_restrictions are checkbox arrays — each checked value appends to the array in the GuestDetail

---

### `src/app/(guest)/book/[eventId]/StepContact.tsx` (client component, event-driven)

**Analog:** `src/components/admin/ReviewForm.tsx`

**Input atom usage pattern** (lines 40-48 of ReviewForm.tsx):
```typescript
      <Input
        id="guest_name"
        name="guest_name"
        label="Guest Name / Initials"
        defaultValue={review?.guest_name ?? ''}
        required
        placeholder="e.g. A.K. or Sarah C."
        error={errors?.guest_name?.join(', ')}
      />
```

**Form layout with gap/space** (lines 33 of ReviewForm.tsx):
```typescript
    <form action={formAction} className="space-y-4">
```

**Adaptation notes:**
- Three `Input` atoms: `name`, `email`, `phone`
- `type="email"` and `type="tel"` on respective inputs
- `autocomplete` attributes: `name="name"`, `autocomplete="email"`, `autocomplete="tel"`
- Props receive `contact` from reducer state and `onChange` dispatcher; no local state
- Error path: `state.errors.name`, `state.errors.email`, `state.errors.phone`
- This step is NOT persisted to sessionStorage (contact is PII — the sessionStorage useEffect destructures contact out)

---

### `src/app/(guest)/book/[eventId]/StepReview.tsx` (presentational component)

**Analog:** `src/app/(guest)/events/[slug]/page.tsx` — summary and venue strip sections

**Section card pattern** (lines 96-109 of events/[slug]/page.tsx):
```typescript
          <div className="bg-cream-200 rounded-lg p-4 mb-10 flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-cream-300 rounded flex items-center justify-center">
              ...
            </div>
            <div>
              <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest mb-0.5">Venue</p>
              <p className="text-sm font-semibold text-burgundy-900">{venue.name}</p>
```

**Metadata label/value pair:**
```typescript
              <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-burgundy-900">{value}</p>
```

**Adaptation notes:**
- Read-only summary of all 4-step data: pax, wine pairing, guest dietary notes, contact
- "Edit" links dispatch `{ type: 'GO_TO_STEP', step: N }` — use `<button>` not `<Link>` (no URL change)
- Use `formatCurrency()` for price totals; `formatDate()` / `formatTime()` for event date/time display
- "Confirm Booking" button at the bottom dispatches `SUBMIT` and calls `submitBooking` via `startTransition`
- Button uses `variant="primary"` `size="lg"` from `src/components/ui/Button.tsx`

---

### `src/app/(guest)/book/[eventId]/BookingSuccess.tsx` (presentational component)

**Analog:** `src/app/(guest)/events/[slug]/page.tsx` — hero/dark header block

**Dark hero block pattern** (lines 53-88 of events/[slug]/page.tsx):
```typescript
      <div className="bg-burgundy-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <p className="text-xs text-gold-400 font-medium uppercase tracking-widest mb-4">
            ...
          </p>
          <h1 className="font-heading font-bold uppercase tracking-wide text-white text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
            ...
          </h1>
```

**Badge usage pattern** (lines 79-80 of events/[slug]/page.tsx):
```typescript
              <Badge variant="success">{seatsLeft} seats remaining</Badge>
```

**Adaptation notes:**
- Display `bookingId` (truncated UUID or reference number) and event details
- Use `<Badge variant="success">` for the "Booking confirmed" status indicator
- Include a `<Link href={`/events/${event.slug}`}>` back to the event detail page
- Clear sessionStorage on mount: `sessionStorage.removeItem(`booking:${event.id}`)`

---

## Shared Patterns

### Supabase Server Client (anon)
**Source:** `src/lib/supabase/server.ts` (entire file, 29 lines)
**Apply to:** `page.tsx` (read), `actions.ts` (RPC call)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(...) { ... } } }
  )
}
```
Import as: `import { createClient } from '@/lib/supabase/server'`

### Error Banner
**Source:** `src/components/admin/EventForm.tsx` lines 44-48
**Apply to:** `BookingForm.tsx` (top-level error from server action)
```typescript
      {errors?._form && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
          {errors._form.join(', ')}
        </div>
      )}
```

### Field Error (inline)
**Source:** `src/components/ui/Input.tsx` lines 25-25
**Apply to:** All step components that use `Input` atom
```typescript
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
```
The `Input` atom renders this automatically when `error` prop is provided. Use the same pattern for non-`Input` fields (checkboxes, textareas).

### Button Disabled During Pending
**Source:** `src/components/admin/EventForm.tsx` lines 231-235
**Apply to:** `StepReview.tsx` (Confirm Booking button), `BookingForm.tsx` (Next buttons)
```typescript
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Submit'}
        </Button>
```
Replace `isPending` with `state.isSubmitting` from the reducer.

### Zod safeParse Pattern
**Source:** `src/app/admin/events/actions.ts` lines 60-63
**Apply to:** `actions.ts` (booking server action)
```typescript
  const parsed = bookingSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: 'Invalid booking data' }
  }
```
Use `bookingSchema` from `src/lib/validators.ts` — already covers all fields and two `.refine()` checks.

### Currency + Date Display Utilities
**Source:** `src/lib/utils.ts`
**Apply to:** `StepParty.tsx` (price summary), `StepReview.tsx` (totals + event date/time), `BookingSuccess.tsx`
```typescript
import { formatCurrency, formatDate, formatTime, getSeatsStatus } from '@/lib/utils'
```

### Tailwind Brand Token Vocabulary
**Source:** `src/app/(guest)/events/[slug]/page.tsx` throughout
**Apply to:** All new components
- Page background: `bg-cream-50`
- Section container: `max-w-3xl mx-auto px-4 sm:px-6 lg:px-8`
- Section dividers: `divide-y divide-cream-300` / `border-b border-cream-300`
- Primary headings: `font-heading font-bold uppercase tracking-wide text-burgundy-900`
- Meta labels: `text-xs text-burgundy-400 font-medium uppercase tracking-widest`
- Body text: `text-sm text-burgundy-500`

### DB Type Imports
**Source:** `src/app/(guest)/events/[slug]/page.tsx` line 8
**Apply to:** `page.tsx`, `BookingForm.tsx`, step components that receive event prop
```typescript
import type { Database } from '@/types/database'
type Event = Database['public']['Tables']['events']['Row']
```

---

## No Analog Found

No files in this phase are truly without analog. All have at least partial matches. The closest to "no analog" is the `useReducer`-driven multi-step form pattern — the codebase only uses `useActionState` for client forms. The RESEARCH.md Pattern 2 (useReducer) and Pattern 4 (startTransition event handler) are authoritative for this gap.

---

## Metadata

**Analog search scope:** `src/app/(guest)/`, `src/app/admin/`, `src/components/`
**Files scanned:** 12 source files read
**Pattern extraction date:** 2026-04-26
