# Requirements: Palette — Booking Flow & Launch Polish

**Defined:** 2026-04-22
**Core Value:** Guests can book seats at upcoming events and provide dietary/allergy information, with the chef receiving everything needed to prepare.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Booking Flow

- [ ] **BOOK-01**: Guest can select party size and wine pairing count on step 1
- [ ] **BOOK-02**: Guest can enter allergy/dietary info for each person in party on step 2
- [ ] **BOOK-03**: Guest can enter contact details (name, email, phone) on step 3
- [ ] **BOOK-04**: Guest can review booking summary and confirm on step 4
- [x] **BOOK-05**: Booking atomically reserves seats via `create_booking` RPC
- [x] **BOOK-06**: Form shows live seat availability and prevents overbooking
- [ ] **BOOK-07**: Submit button is disabled during submission to prevent double-submit
- [ ] **BOOK-08**: Form progress persists to sessionStorage across page refreshes

### Admin Bookings

- [ ] **ADMIN-01**: Admin can view per-event booking list with guest details and allergy severity badges
- [ ] **ADMIN-02**: Admin can cancel any booking from the dashboard

### Mobile

- [ ] **MOBL-01**: Guest site pages are fully responsive on mobile viewports
- [ ] **MOBL-02**: Admin dashboard is usable on tablet viewports
- [ ] **MOBL-03**: Booking form flow works correctly on mobile with proper keyboard handling

### SEO

- [ ] **SEO-01**: Event detail pages have dynamic meta tags via `generateMetadata()`
- [ ] **SEO-02**: Guest pages have static OG image fallback

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Email

- **MAIL-01**: Guest receives booking confirmation email
- **MAIL-02**: Admin receives new-booking alert email
- **MAIL-03**: Guests receive event reminder 24h before event (cron)

### Admin

- **ADMN-01**: Guest CRM page with booking history

### Security

- **SEC-01**: Tighten RLS INSERT policies to require RPC
- **SEC-02**: Fix `requireAuth()` to redirect instead of throwing 500

### Testing

- **TEST-01**: Vitest unit tests for validators and utils
- **TEST-02**: Playwright E2E for booking happy path

### Polish

- **POST-01**: Guest self-service cancellation via email link
- **POST-02**: Post-event follow-up email
- **POST-03**: Dynamic OG images via `next/og`

## Out of Scope

| Feature | Reason |
|---------|--------|
| Stripe/payment integration | Manual payment for now (transfer or on-site) |
| SMS notifications | Email only |
| Guest accounts / public signup | Admin-only auth |
| Mobile native app | Responsive web only |
| Waitlist for sold-out events | Low ROI at 8-20 seat scale |
| Booking modification (change pax/date) | Cancel and rebook is simpler |
| Multi-admin roles/permissions | 2-3 team members, single role sufficient |
| Real-time seat updates (websockets) | ISR revalidation sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOOK-01 | Phase 1 | Pending |
| BOOK-02 | Phase 1 | Pending |
| BOOK-03 | Phase 1 | Pending |
| BOOK-04 | Phase 1 | Pending |
| BOOK-05 | Phase 1 | Complete |
| BOOK-06 | Phase 1 | Complete |
| BOOK-07 | Phase 1 | Pending |
| BOOK-08 | Phase 1 | Pending |
| ADMIN-01 | Phase 2 | Pending |
| ADMIN-02 | Phase 2 | Pending |
| MOBL-01 | Phase 3 | Pending |
| MOBL-02 | Phase 3 | Pending |
| MOBL-03 | Phase 3 | Pending |
| SEO-01 | Phase 4 | Pending |
| SEO-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-22*
*Last updated: 2026-04-22 after roadmap creation*
