# Architecture Patterns

**Project:** Palette — Booking Flow & Launch Polish
**Researched:** 2026-04-22
**Confidence:** HIGH (based on direct codebase inspection, not inference)

---

## Existing Architecture (What Is Already Built)

The architecture is established and must not be redesigned. All new components must fit
the patterns already in use. This document records what exists and how new features attach
to it.

### System Boundary Map

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER                                                         │
│  Guest site (SSR, public)    Admin dashboard (CSR, auth-gated)  │
└────────────┬─────────────────────────┬───────────────────────── ┘
             │ HTML (SSR)              │ Server Actions / RSC
             ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ NEXT.JS 16 APP ROUTER (Vercel)                                  │
│                                                                 │
│  src/app/(guest)/           src/app/admin/                      │
│  └─ SSR Server Components   └─ CSR Client Components            │
│     revalidate: 60s            Server Actions ('use server')    │
│                                requireAuth() guard              │
│  src/app/api/                                                   │
│  └─ Route Handlers                                              │
│     /api/cron/reminders (to be built)                           │
│                                                                 │
│  middleware.ts → updateSession() on all routes                  │
└───────┬─────────────────────┬───────────────────────────────────┘
        │ anon key + RLS      │ service-role key (bypasses RLS)
        ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ SUPABASE                                                        │
│  PostgreSQL (RLS on all tables)                                 │
│  Auth (email/password)                                          │
│  Storage (venue-photos, dish-photos buckets)                    │
│  DB functions: create_booking(), cancel_booking()              │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼ fire-and-forget (no await on booking response)
┌─────────────────────────────────────────────────────────────────┐
│ RESEND (transactional email)                                    │
│  Installed (resend ^6.10.0), not yet wired                      │
│  Planned: BookingConfirmation, AdminAlert, EventReminder        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

### 1. Guest Booking Flow (NEW — the central work of this milestone)

```
src/app/(guest)/book/[eventId]/
├── page.tsx           ← Server Component: fetch event data, render shell
└── BookingWizard.tsx  ← 'use client': owns all form state via useReducer
    ├── Step1Pax.tsx         ← pax count + wine pairing selection
    ├── Step2Allergies.tsx   ← per-guest allergy/dietary form (pax × 1 form)
    ├── Step3Contact.tsx     ← name, email, phone
    └── Step4Confirm.tsx     ← review summary + submit
```

The page.tsx fetches event data server-side (ISR, revalidate: 60). BookingWizard is a
client component that manages the multi-step state without any server round-trips between
steps. On final submit, it calls a Server Action.

**Booking submission path:**
```
BookingWizard (submit) 
  → submitBooking() server action
  → requireAuth() is NOT called (guest-facing, no auth requirement)
  → bookingSchema.safeParse() validation (Zod — schema already exists in validators.ts)
  → supabase.rpc('create_booking', payload)  ← uses service-role client for the RPC
     └─ Postgres function: row-locks event, validates seats, upserts guest,
        creates booking + guest_details, increments booked_seats — all atomic
  → Returns booking_id
  → [fire-and-forget] sendBookingEmails(bookingId) — does NOT block response
  → revalidatePath('/events/[slug]')  ← bust seat count cache
  → redirect('/book/[eventId]/confirmation')
```

Note: The booking RPC is `SECURITY DEFINER` so it can run under the anon key via RLS
policy (`"Public can create bookings"`). A service-role client is NOT required for the RPC
call itself, but is the safer default given the pattern already used for mutations.

**Cancellation path:**
```
Guest cancellation link (emailed token or booking ID lookup)
  → /api/bookings/[id]/cancel  ← Route Handler or server action
  → verify 48-hour window
  → supabase.rpc('cancel_booking', { p_booking_id, p_is_admin: false })
  → send BookingCancellation email
  → redirect to confirmation
```

Admin cancellation (from admin/events/[id]/bookings):
```
Cancel button → cancelBooking() server action
  → requireAuth()
  → supabase.rpc('cancel_booking', { p_booking_id, p_is_admin: true })
  → revalidatePath('/admin/events/[id]/bookings')
```

---

### 2. Email Notification Layer (NEW)

Resend is installed but unwired. The integration point is a thin `src/lib/email.ts` module.

```
src/lib/email.ts
  ├── sendBookingConfirmation(bookingId)  ← fetches booking + event + guest, sends to guest
  ├── sendAdminBookingAlert(bookingId)    ← sends to admin email on new booking
  └── sendEventReminder(eventId)         ← fetches all confirmed bookings, sends to each guest

emails/ (React Email templates — referenced in PROJECT.md but not found on disk)
  ├── BookingConfirmation.tsx
  ├── BookingCancellation.tsx
  ├── EventReminder.tsx
  └── PostEventFollowUp.tsx
```

Email functions are called **fire-and-forget** from server actions — `Promise` is not
awaited. This means booking response is never blocked by email delivery. Failures are
logged but do not surface to guests.

The Resend API key (`RESEND_API_KEY`) is a new required environment variable.

---

### 3. Cron / Event Reminder (NEW)

Vercel cron is already configured in `vercel.json` (`/api/cron/reminders`, daily 10:00 UTC).
The route handler file does not yet exist.

```
src/app/api/cron/reminders/route.ts
  ← GET handler (Vercel calls via cron schedule)
  ← Verify CRON_SECRET header (Vercel passes this automatically)
  ← Query events WHERE event_date = CURRENT_DATE + 1 (tomorrow)
  ← For each event: fetch confirmed bookings → sendEventReminder()
  ← Return 200 OK
```

This is a standalone Route Handler, not a Server Action, because it is triggered by Vercel
infrastructure rather than a user form.

---

### 4. Admin Bookings Dashboard (PARTIAL — shell exists)

`src/app/admin/events/[id]/bookings/page.tsx` already exists and renders a read-only
booking list with guest details and allergy badges. What it lacks:

- Cancel booking action (server action + button)
- Booking notes editing
- Export/print-friendly view (optional)

The data fetch pattern is already established:
```
Server Component → parallel fetch: event + bookings + guests + guest_details
                → assemble Maps (guestMap, detailsByBooking)
                → render
```

The cancel action slots in alongside the existing read page:

```
src/app/admin/events/[id]/bookings/
├── page.tsx        ← existing read page (add cancel button)
└── actions.ts      ← NEW: cancelBooking() server action
```

---

### 5. Guest CRM (STUB EXISTS)

`src/app/admin/guests/page.tsx` exists. It shows a flat guest list with booking counts,
fetched with a manual join (fetch all bookings, build a Map). What is missing:

- Per-guest detail view (`/admin/guests/[id]`) showing booking history
- Booking history with event names, dates, amounts paid
- Dietary profile summary across all bookings

This is a pure read feature. The data model is already complete (guests, bookings,
guest_details tables with proper indexes). No new DB migrations required.

---

## Data Flow — Complete Picture

### Seat Availability (Guest Read Path)

```
Browser → GET /events/[slug]
        → Server Component (revalidate: 60s)
        → createClient() anon key
        → SELECT events JOIN venues JOIN courses WHERE slug = ?
        → RLS: only published/sold_out/completed events visible
        → Render seat count badge (available / almost_full / sold_out)
        → sticky CTA links to /book/[event.id]  ← uses UUID, not slug
```

ISR at 60 seconds means seat counts can be up to 60 seconds stale. This is acceptable
given the small event sizes (8–30 seats) and the atomic `create_booking` RPC preventing
double-booking at the DB layer regardless of what the UI shows.

### Booking Write Path (with email side-effect)

```
Step 1-3: Client state only (useReducer in BookingWizard, no server calls)
Step 4 submit:
  Browser → submitBooking() Server Action
           → Zod validation (bookingSchema)
           → supabase.rpc('create_booking', {
               p_event_id, p_guest_name, p_guest_email, p_guest_phone,
               p_pax, p_wine_pairing_count,
               p_guest_details: [{guest_name, allergies, dietary_restrictions,
                                   severity, other_allergies, special_requests}, ...]
             })
           → DB: atomic — row lock event → validate → upsert guest → create booking
                          → insert guest_details → update booked_seats → return booking_id
           → [fire-and-forget] sendBookingConfirmation(bookingId)
           → [fire-and-forget] sendAdminBookingAlert(bookingId)
           → revalidatePath('/events/' + eventSlug)
           → redirect('/book/' + eventId + '/confirmation')
```

Error handling: if the RPC raises an exception (sold out, deadline passed, event not
found), the server action returns `{ error: string }` — the BookingWizard stays on the
final step and shows the error inline. No redirect on failure.

### Admin Read Path

```
Browser → /admin/events/[id]/bookings
        → Server Component (no ISR — admin pages are dynamic)
        → createClient() anon key (admin pages use anon key for reads)
        → Parallel fetch: event + bookings + guests + guest_details
        → Assemble in-memory Maps
        → Render
```

Note: Admin reads use the anon key (server client) because Supabase admin client
(service-role) is reserved for mutations only. There are no RLS policies blocking admin
reads — the admin session means middleware already verified auth, and all tables are
readable with the anon key when called server-side (middleware ensures the session cookie
is valid, so Supabase treats these as authenticated requests). Actually — admin tables
(guests, bookings, guest_details) have no public read RLS policy, so admin reads via the
anon key succeed only because the Supabase server client carries the admin's session JWT,
which bypasses the "no policy = deny" default via authenticated role in Postgres.

---

## Suggested Build Order (Dependencies Between Components)

### Dependency Graph

```
[Email module src/lib/email.ts]
    ↑ required by
[Booking Server Action]  ←──── [BookingWizard Client Component]
    ↑ required by                      ↑ required by
[Booking Confirmation page]         [Booking page.tsx]
    
[cancel_booking RPC — already exists in DB]
    ↑ wired by
[Admin cancel action]  ←── [Bookings page cancel button]

[Cron Route Handler] — independent, depends only on email module
```

### Recommended Build Sequence

**Phase A — Booking Flow (blocks everything else)**
1. `src/app/(guest)/book/[eventId]/page.tsx` — server shell fetches event, renders wizard wrapper
2. `BookingWizard` with `useReducer` state machine — pure client, no server calls yet
3. `submitBooking()` server action — wires RPC, validates, redirects
4. `src/app/(guest)/book/[eventId]/confirmation/page.tsx` — success state

**Phase B — Email (unblocked after booking action exists)**
5. React Email templates in `emails/` (verify if they exist on disk — PROJECT.md says they do, but `glob` found nothing)
6. `src/lib/email.ts` — thin module wrapping Resend with the four send functions
7. Wire fire-and-forget calls into `submitBooking()` action

**Phase C — Admin Wiring (partial work already done)**
8. `cancelBooking()` server action in `src/app/admin/events/[id]/bookings/actions.ts`
9. Cancel button in existing bookings page — uses the action
10. Guest detail page `/admin/guests/[id]` — booking history read view

**Phase D — Cron**
11. `src/app/api/cron/reminders/route.ts` — depends on email module (Phase B)

**Phase E — Polish (independent, can be done any order)**
12. Mobile responsive pass across all pages
13. SEO meta tags (`generateMetadata()`) for guest pages
14. OG images (static or dynamic via `ImageResponse`)
15. Integration/E2E tests (Playwright for booking happy path)

---

## Patterns to Follow

### Pattern 1: Server Action for Guest Mutations

Guest-facing mutations (booking submission) follow the same shape as admin actions, but
without `requireAuth()`.

```typescript
// src/app/(guest)/book/[eventId]/actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { bookingSchema } from '@/lib/validators'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitBooking(payload: unknown) {
  const parsed = bookingSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  const db = createAdminClient()
  const { data: bookingId, error } = await db.rpc('create_booking', {
    p_event_id: parsed.data.eventId,
    p_guest_name: parsed.data.guestName,
    // ...
  })

  if (error) return { error: { _form: [error.message] } }

  // Fire-and-forget — do NOT await
  void sendBookingEmails(bookingId)

  revalidatePath(`/events/${eventSlug}`)
  redirect(`/book/${parsed.data.eventId}/confirmation`)
}
```

### Pattern 2: Multi-Step Form with useReducer

Four-step wizard state lives entirely in client memory. No server calls between steps.

```typescript
type WizardState = {
  step: 1 | 2 | 3 | 4
  pax: number
  winePairingCount: number
  guestDetails: GuestDetail[]
  contact: { name: string; email: string; phone: string }
}

type WizardAction =
  | { type: 'SET_PAX'; pax: number; winePairingCount: number }
  | { type: 'SET_GUEST_DETAIL'; index: number; detail: GuestDetail }
  | { type: 'SET_CONTACT'; contact: WizardState['contact'] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
```

On step 4 confirm, the full accumulated state is passed to the server action in one call.

### Pattern 3: Fire-and-Forget Email

```typescript
// Do NOT: await sendBookingConfirmation(bookingId)
// DO:
void sendBookingConfirmation(bookingId).catch((err) => {
  console.error('[email] booking confirmation failed:', err)
})
```

Email failures are logged but never surfaced to the guest. The booking is committed before
the email attempt.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Supabase for Booking Submission

Calling `supabase.rpc('create_booking')` directly from the browser would expose the
service-role key or rely on anon key with RLS. The booking RPC is `SECURITY DEFINER` so
the anon key would technically work, but all write paths in this codebase go through
Server Actions. Do not break this pattern.

### Anti-Pattern 2: Awaiting Emails Before Redirecting

```typescript
// WRONG — blocks guest response on email delivery
await sendBookingConfirmation(bookingId)
redirect('/confirmation')
```

Resend can be slow or fail. The booking is committed atomically by the DB function. Email
is a side effect. Never let email failure prevent a booking confirmation redirect.

### Anti-Pattern 3: Multi-Step Form With Server Calls Between Steps

Each wizard step transition should be purely local state. Calling the server to validate
step 1 before showing step 2 introduces unnecessary latency and complexity. Zod validation
on the full payload at submission time catches everything.

### Anti-Pattern 4: ISR on Admin Pages

Admin pages must always show current data (bookings, seat counts). Do not add
`export const revalidate = 60` to admin routes. Leave them as dynamic (default behavior).

---

## Scalability Considerations

This platform targets 2-3 admin users and events of 8-30 seats. Scalability is not a
concern for launch. Constraints that matter:

| Concern | Current Approach | Limit |
|---------|-----------------|-------|
| Double-booking | DB row lock in create_booking RPC | Safe at any concurrency |
| Seat count display | ISR 60s on event detail page | Acceptable for event sizes |
| Email delivery | Resend fire-and-forget | Resend free tier: 100/day, plenty |
| Cron | Vercel cron daily 10:00 UTC | One invocation/day, trivial |
| Admin reads | Dynamic Server Components | Fine for 2-3 admin users |

---

## Sources

- Direct codebase inspection (HIGH confidence):
  - `supabase/migrations/001_initial_schema.sql` — full schema
  - `supabase/migrations/003_functions.sql`, `004_cancel_booking_and_fixes.sql` — DB functions
  - `supabase/migrations/002_rls_policies.sql` — RLS policies
  - `src/lib/validators.ts` — Zod schemas (bookingSchema already complete)
  - `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts` — client factories
  - `src/lib/auth.ts` — requireAuth() implementation
  - `src/app/(guest)/events/[slug]/page.tsx` — existing event detail (ISR 60s pattern)
  - `src/app/admin/events/[id]/bookings/page.tsx` — existing bookings read page
  - `src/app/admin/guests/page.tsx` — existing guest CRM stub
  - `src/app/admin/events/actions.ts` — admin server action pattern reference
  - `src/app/admin/settings/page.tsx` — confirms Resend is planned
  - `vercel.json` — cron configuration
  - `package.json` — confirms resend ^6.10.0 installed, no react-email
  - `.planning/codebase/ARCHITECTURE.md` — codebase map
  - `.planning/codebase/INTEGRATIONS.md` — integration audit
