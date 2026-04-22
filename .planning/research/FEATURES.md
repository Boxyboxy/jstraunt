# Feature Landscape

**Domain:** Private dining / intimate tasting menu booking platform
**Project:** Palette (Singapore, SGD)
**Researched:** 2026-04-22
**Confidence:** HIGH (schema + existing code + domain analysis) / MEDIUM (behavioral expectations from domain knowledge)

---

## Table Stakes

Features guests and operators expect. Missing one = platform feels broken or untrustworthy.

### Booking Flow

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Party size selection with seat validation | Guests cannot book more than available seats; core UX | Low | `create_booking` RPC already enforces this atomically |
| Per-guest dietary/allergy collection | Chef safety requirement for tasting menus; life-threatening allergy severity field already in schema | Medium | Schema has `severity` enum: `preference / intolerance / life_threatening` — must surface clearly in UI |
| Wine pairing opt-in per guest | Already in schema and pricing model | Low | `wine_pairing_count <= pax` validation in Zod already exists |
| Contact details (name, email, phone) | Required for confirmation email and admin contact | Low | All in `guests` table |
| Booking confirmation page / success state | Without this, guests refresh and re-submit | Low | Must show: booking reference, event details, total paid, next-steps |
| Inline seat availability indicator | Users need to know how many seats remain before choosing pax | Low | Already shown on event detail; needs live-ish count on booking form too |
| Booking deadline enforcement | Prevents bookings after the kitchen has planned courses | Low | Already enforced in `create_booking` RPC; UI must surface deadline clearly |
| Sold-out guard on form entry | Users hitting `/book/[id]` directly when sold out must be blocked | Low | RPC enforces, but UI must show graceful error not a blank 500 |

### Email Notifications

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Guest booking confirmation email | Standard transactional expectation; without it guests assume booking failed | Low | Resend installed, React Email templates exist in `emails/` directory |
| Admin new-booking alert email | Operator needs to know when a seat is taken, especially for small intimate events | Low | Fire-and-forget; send to a fixed admin email env var |
| Cancellation confirmation email | Guest needs proof the cancellation went through | Low | Template likely needed alongside `cancel_booking` RPC |
| Event reminder email (24h before) | Venue address, time, what to expect — reduces no-shows | Medium | Cron job configured in `vercel.json` at `0 10 * * *`; route file missing |

### Admin Booking Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-event booking list with guest details | Chef needs a printed/viewable list before service | Low | Page scaffold exists at `/admin/events/[id]/bookings/` but lacks cancel action |
| Admin booking cancellation | Admin must be able to cancel regardless of 48h window | Low | `cancel_booking(p_is_admin: true)` already handles this in the RPC |
| Booking status display (confirmed / cancelled / no_show) | Operator needs at-a-glance status | Low | Badge component + status enum already in place |
| Seat count summary per event | Fill rate visible at a glance on dashboard | Low | Already implemented on admin dashboard |

### Guest CRM

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Guest list with booking history count | Repeat guests are the lifeblood of a private dining business | Low | Scaffold exists at `/admin/guests/`; shows count but no click-through to history |
| Guest allergy/restriction visibility from CRM | Chef may need to look up a returning guest's restrictions | Medium | Requires join from guests → bookings → guest_details |

### Cancellation

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Guest-initiated cancellation within 48h window | Without self-service cancel, all cancellations become admin work | Medium | RPC enforces 48h policy; needs a cancel page/form accessible to guest via booking reference or confirmation email link |
| Clear cancellation policy display | Guests must know the 48h window before booking | Low | Add to booking confirmation page and confirmation email |

### Mobile & Polish

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Mobile-responsive booking form | Majority of reservation traffic is mobile | Medium | Multi-step form needs touch-friendly inputs, large tap targets |
| Mobile-responsive admin dashboard | Admin manages from phone during/after events | Medium | Table layouts need to collapse on narrow screens |
| SEO meta tags on event pages | Guests share links; OG preview in iMessage/WhatsApp matters in SG market | Low | Next.js `generateMetadata` on event detail page |
| OG image for events | Link previews in messaging apps drive bookings in tight social circles | Medium | Can use static branded image if dynamic generation is too complex |

---

## Differentiators

Features that set Palette apart from generic booking tools. Not universally expected, but high value for the target market.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-guest allergy severity tiering | Life-threatening vs preference is a meaningful distinction that shows care and professionalism; most booking platforms lump all dietary needs together | Low | Already in schema; just needs clear UI treatment with colour-coded badges |
| Allergy summary sheet for chef | One-click printable view of all guests' restrictions for a given event | Medium | Derived from existing data; a dedicated print-optimised page or export is high value for kitchen prep |
| Wine pairing opt-in per party (not per guest) | More flexible than all-or-none; matches how private dining actually works | Low | Already modelled in schema as a count |
| Repeat guest recognition in admin | "Joined 6 months ago, 4 bookings" — builds relationship context | Low | Count already on guests page; enrich with last-booked event title |
| Post-event follow-up email | Thank you + review request; drives the testimonials that power the homepage | Medium | `PostEventFollowUp` React Email template referenced but not yet triggered; needs a cron or admin manual trigger |
| Booking reference number | Provides guest a reference for cancellation inquiries without an account | Low | Booking UUID from `create_booking` RPC can serve as reference |
| Event status transitions visible to admin | Draft → Published → Sold Out → Completed lifecycle visible in UI | Low | Enum exists; admin needs ability to manually set `completed` and `cancelled` status |

---

## Anti-Features

Features to deliberately NOT build for this milestone. Each has a reason and an alternative.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Guest accounts / login | Adds auth complexity, password reset flows, and account management overhead for a low-frequency product (1-2 bookings per year per guest) | Treat booking reference as identity; email link for cancellation |
| Real-time seat count websockets | Overkill for 8-20 seat events where simultaneous booking races are rare | ISR 60s revalidation is already in place; RPC handles race atomically even if UI is stale |
| Waitlist management | Adds significant complexity (queue management, notification sequencing, expiry); low ROI for intimate events where seats rarely re-open | Admin cancels and re-publishes if seats open |
| Stripe / payment processing | Scoped out of this milestone; adds PCI surface area, webhook handling, refund flows | Manual payment (bank transfer or on-site); `total_price` stored for reference |
| SMS notifications | Twilio integration is stub in settings page; adds cost and complexity | Email only via Resend |
| Public event discovery / SEO waitlist | Private dining is invite-network driven; public indexing may not be desired | Control via `draft` status; only `published` events are visible |
| Capacity holds / deposits | Requires payment integration to be meaningful | Out of scope until Stripe is added |
| Multi-admin roles / permissions | Solo/small team (2-3 users) with identical access needs | Single admin tier via Supabase email/password |
| Booking modification (edit after submit) | Complex seat accounting; cancel + rebook is simpler and has identical user outcome | Cancel within 48h window and rebook |
| Native app | Responsive web covers the use case for both admin and guest | Mobile-responsive web |

---

## Feature Dependencies

The ordering below reflects implementation constraints. A feature cannot be built before its dependencies.

```
Seat availability check (UI)
  → Booking form step 1 (pax/wine selection)
      → Booking form step 2 (per-guest dietary details)
          → Booking form step 3 (contact details)
              → Booking form step 4 (review + confirm)
                  → create_booking RPC call (atomic seat lock)
                      → Booking confirmation page
                          → Guest confirmation email (Resend)
                          → Admin alert email (Resend)

Guest cancellation flow
  → Requires: booking reference lookup (by ID or email)
  → cancel_booking RPC (48h enforcement)
      → Cancellation confirmation email

Admin cancel booking
  → Requires: per-event booking list with cancel action
  → cancel_booking RPC (admin bypass)
      → Cancellation confirmation email (same template)

Event reminder cron
  → Requires: confirmed bookings in DB
  → Requires: Resend wired
  → /api/cron/reminders route handler (currently missing file)

Post-event follow-up email
  → Requires: Resend wired
  → Requires: event marked `completed`
  → Cron or admin-triggered

Guest CRM detail view
  → Requires: bookings confirmed via booking flow
```

---

## MVP Recommendation

For this milestone (booking flow + launch polish), the strict priority order:

**Must ship (blocking launch):**
1. Multi-step booking form at `/book/[eventId]` — the entire product is blocked without this
2. Booking confirmation page with cancellation policy disclosure
3. Guest confirmation email via Resend (guests won't trust a booking without it)
4. Admin new-booking alert email (operator must know immediately)
5. Admin cancel booking action on per-event bookings page
6. Mobile responsive pass on booking form and event detail pages

**Should ship (launch quality):**
7. Event reminder cron (24h before) — `/api/cron/reminders` route
8. SEO meta tags on event detail pages (`generateMetadata`)
9. Admin bookings dashboard improvements (allergy severity clearly badged, totals)
10. Guest CRM: click through from guest to booking history

**Defer (post-launch):**
- Guest self-service cancellation (requires booking reference lookup mechanism; admin cancel covers the gap)
- Post-event follow-up email (valuable but not launch-blocking)
- OG image generation (static branded OG image is acceptable at launch)
- Allergy summary print sheet (admin can read from booking list for now)
- Pagination on admin guest list (low data volume at launch)

---

## Sources

- Codebase analysis: `src/types/database.ts`, `supabase/migrations/003_functions.sql`, `004_cancel_booking_and_fixes.sql`
- Existing admin page scaffolds: `/admin/events/[id]/bookings/page.tsx`, `/admin/guests/page.tsx`
- Existing validators: `src/lib/validators.ts` (bookingSchema, guestDetailSchema)
- Project requirements: `.planning/PROJECT.md`
- Technical concerns: `.planning/codebase/CONCERNS.md`
- Integration audit: `.planning/codebase/INTEGRATIONS.md`
- Domain knowledge: Private dining and restaurant reservation UX patterns (HIGH confidence for established patterns; MEDIUM confidence for market-specific behaviors)
