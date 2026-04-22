# Palette — Booking Flow & Launch Polish

## What This Is

Palette is a private dining booking platform for intimate tasting menu experiences at rotating venues across Singapore. The guest site and admin dashboard are built — this milestone adds the end-to-end booking flow and polishes the product for launch.

## Core Value

Guests can book seats at upcoming events and provide dietary/allergy information, with the chef receiving everything needed to prepare.

## Requirements

### Validated

- ✓ Admin can log in with email/password — Phase 1
- ✓ Admin sidebar navigation with route protection — Phase 1
- ✓ Database schema with venues, events, courses, guests, bookings, reviews, past dishes — Phase 1
- ✓ Admin can create, edit, and manage venues with photos — Phase 2
- ✓ Admin can create, edit, and manage events with menu builder — Phase 2
- ✓ Admin can upload images to Supabase Storage — Phase 2
- ✓ Admin can manage reviews (create, toggle visibility, feature) — Phase 2
- ✓ Guest can view homepage with hero, featured reviews, past dishes preview — Phase 3
- ✓ Guest can browse upcoming events on calendar page — Phase 3
- ✓ Guest can view event detail with menu, venue info, and seat availability — Phase 3
- ✓ Guest can browse past dishes gallery — Phase 3

### Active

- [ ] Multi-step booking form (pax/wine → allergies per guest → contact → review/confirm)
- [ ] Atomic booking via `create_booking` RPC with seat locking
- [ ] Booking cancellation with 48-hour policy enforcement
- [ ] Seat availability checking with optimistic UI
- [ ] Email notifications via Resend (booking confirmation, admin alert)
- [ ] Admin bookings dashboard with per-event booking list
- [ ] Guest CRM page (guest list with booking history)
- [ ] Event reminder cron job (24h before event)
- [ ] Mobile responsive pass across all guest and admin pages
- [ ] SEO meta tags and OG images for guest pages
- [ ] Testing (integration tests for booking flow, E2E for happy path)

### Out of Scope

- Stripe/payment integration — manual payment for now (transfer or on-site)
- SMS notifications — email only
- Guest accounts / public signup — admin-only auth
- Mobile native app — responsive web only
- OAuth login — email/password sufficient
- Real-time seat updates via websockets — ISR revalidation is sufficient

## Context

- Singapore market, prices in SGD
- Solo/small team operation (2-3 admin users)
- Events are intimate (8-20 seats typically, max 30)
- The `create_booking` and `cancel_booking` database functions already exist in migrations (`003_functions.sql`, `004_cancel_booking_and_fixes.sql`) but are not yet wired to the frontend
- Resend is installed in `package.json` but not yet wired in source code
- React Email templates exist in `emails/` directory (BookingConfirmation, BookingCancellation, EventReminder, PostEventFollowUp)
- The `/book/[eventId]` route is linked from event detail but does not exist yet

## Constraints

- **Tech stack**: Next.js 15 App Router + Supabase + Tailwind v4 — already established
- **Auth pattern**: Service-role client for mutations behind `requireAuth()`, anon client for guest reads via RLS
- **Mutation pattern**: Server Actions with Zod validation, `revalidatePath()` + `redirect()`
- **No ORM**: Supabase JS client with auto-generated types from `database.ts`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 4-step booking form with useReducer | Match technical design; keeps steps atomic and validated | — Pending |
| Fire-and-forget email notifications | Don't block booking response on email delivery | — Pending |
| ISR (60s revalidation) for seat counts | Avoids websocket complexity while keeping data fresh enough | — Pending |
| Priority order for Phase 5: mobile → testing → admin bookings → CRM → SEO → cron | User-specified priority based on launch needs | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-22 after initialization*
