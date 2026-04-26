# Roadmap: Palette — Booking Flow & Launch Polish

## Overview

This milestone wires the end-to-end booking flow onto the existing guest site and admin dashboard, then closes the gap to launch. The booking form is the critical path — everything else depends on it or runs independently after it. Phases proceed from the core transactional feature outward to admin tooling, then independent polish passes for mobile and SEO.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Booking Flow** - Guest can complete a multi-step booking and atomically reserve seats
- [ ] **Phase 2: Admin Bookings** - Admin can view per-event booking lists and cancel any booking
- [ ] **Phase 3: Mobile Responsive** - All guest and admin pages are fully usable on mobile and tablet
- [ ] **Phase 4: SEO** - Guest-facing event pages have proper meta tags and OG image fallback

## Phase Details

### Phase 1: Booking Flow
**Goal**: Guests can book seats at an event end-to-end, with seat reservation guaranteed and double-submission prevented
**Depends on**: Nothing (first phase)
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08
**Success Criteria** (what must be TRUE):
  1. Guest can navigate a 4-step form (pax/wine → allergies per guest → contact → review/confirm) from the event detail page
  2. Guest can submit the booking and have seats atomically reserved via the `create_booking` RPC, with no overbooking possible
  3. Guest sees live seat availability and cannot proceed past step 1 when seats are full
  4. Submit button is disabled during submission and cannot be clicked twice
  5. Refreshing the browser mid-form does not lose form state (non-PII fields restored from sessionStorage)
**Plans**: 4 plans
Plans:
- [ ] 01-01-PLAN.md — Server action (submitBooking) and ISR page with sold-out guard
- [ ] 01-02-PLAN.md — StepIndicator, StepParty, StepDietary components
- [ ] 01-03-PLAN.md — StepContact, StepReview, BookingSuccess components
- [ ] 01-04-PLAN.md — BookingForm root component (useReducer, sessionStorage, handleConfirm) + activate page.tsx
**UI hint**: yes

### Phase 2: Admin Bookings
**Goal**: Admin can see who has booked each event and cancel any booking from the dashboard
**Depends on**: Phase 1
**Requirements**: ADMIN-01, ADMIN-02
**Success Criteria** (what must be TRUE):
  1. Admin can open any event and see a list of all bookings with guest name, party size, contact info, and allergy severity badges
  2. Admin can cancel any booking from the dashboard, triggering the `cancel_booking` RPC and updating seat count
**Plans**: TBD
**UI hint**: yes

### Phase 3: Mobile Responsive
**Goal**: Every guest-facing page and the admin dashboard are fully usable without horizontal scrolling or broken layouts on mobile and tablet viewports
**Depends on**: Phase 1
**Requirements**: MOBL-01, MOBL-02, MOBL-03
**Success Criteria** (what must be TRUE):
  1. All guest site pages (homepage, events, gallery, event detail, booking flow) render correctly on a 390px viewport with no overflow or clipped content
  2. Admin dashboard is navigable and usable on a 768px tablet viewport
  3. Booking form step transitions, input keyboards, and the "Next Step" CTA all behave correctly on iOS Safari mobile
**Plans**: TBD
**UI hint**: yes

### Phase 4: SEO
**Goal**: Event detail pages are discoverable and shareable with accurate meta tags and a fallback OG image
**Depends on**: Phase 1
**Requirements**: SEO-01, SEO-02
**Success Criteria** (what must be TRUE):
  1. Event detail pages include a `<title>` and `<meta description>` generated from event data via `generateMetadata()`
  2. Guest pages display a static OG image fallback when shared on social platforms (WhatsApp, Telegram, etc.)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Booking Flow | 0/4 | Not started | - |
| 2. Admin Bookings | 0/? | Not started | - |
| 3. Mobile Responsive | 0/? | Not started | - |
| 4. SEO | 0/? | Not started | - |
