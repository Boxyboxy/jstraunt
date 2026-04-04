# Private Dining Experience — Product Requirements Document

**Version 1.0 · April 2026 · Prepared for Box**

---

## 1. Executive Summary

This document defines the product requirements for a private dining booking platform designed for a kitchen takeover experience based in San Francisco. The platform connects a small culinary team (2–3 people) with guests who book individual seats at communal tasting menu events hosted at rotating venues on weekends.

The MVP delivers a public-facing website for guests to discover, browse, and book upcoming dining events, paired with an admin dashboard for the chef team to manage events, menus, venue details, pricing, reviews, and guest communications. Bookings are confirmed instantly when seats are available, and notifications are sent via email. Guests may cancel up to 48 hours before the event.

---

## 2. Product Overview

### 2.1 Business Model

- **Format:** Fixed multi-course tasting menu with optional wine pairing, served communal-style
- **Venue:** Kitchen takeovers at rotating locations; each event has its own configured venue with address and write-up
- **Capacity:** 10–16 seats per event; guests book individually and may be seated with strangers
- **Cadence:** Weekend events only (Friday and/or Saturday evenings)
- **Team:** Small crew of 2–3 (chef + sous/service)

### 2.2 Users

| User | Description | Primary Actions |
|------|-------------|-----------------|
| Guest | Diner browsing and booking events | Browse events, book seats, submit allergy/request form, view past menus, read reviews |
| Admin (Chef) | Chef team managing operations | Create/edit events, configure menus and pricing, manage venue details, moderate reviews, view bookings |

### 2.3 Success Metrics

- **Seat fill rate:** percentage of available seats booked per event
- **Booking conversion:** visitors who complete a booking vs. visitors who view an event
- **Repeat guests:** percentage of return diners
- **No-show rate:** bookings that result in no-shows (future: reduce with deposits)

---

## 3. Feature Specifications

### 3.1 Event & Booking System

The core of the platform. Admin creates dining events; guests discover and book seats.

#### 3.1.1 Event Creation (Admin)

| Field | Type | Notes |
|-------|------|-------|
| Event Title | Text | e.g. "Spring Omakase at The Loft" |
| Date & Time | Datetime | Weekends only; start time of service |
| Total Seats | Number | 10–16; determines booking capacity |
| Venue | Venue selector | Links to a configured venue (see 3.3) |
| Menu | Menu builder | Attach courses for this specific event (see 3.2) |
| Price Per Seat | Currency | Base price per guest |
| Wine Pairing Option | Toggle + Price | Optional add-on with separate price |
| Booking Deadline | Datetime | Cut-off for accepting bookings |
| Status | Enum | Draft / Published / Sold Out / Completed / Cancelled |
| Event Description | Rich text | Optional narrative or theme description |

#### 3.1.2 Event Discovery (Guest)

- Homepage hero displays next upcoming event with countdown
- Calendar view showing all published events on a monthly grid
- Event detail page showing menu, venue, price, and seats remaining
- Clear visual indicators: available, almost full (≤3 seats), sold out

#### 3.1.3 Booking Flow (Guest)

Instant confirmation when seats are available. Minimum booking size is 1 seat.

1. Guest selects an event and chooses number of seats (minimum 1)
2. Guest opts in/out of wine pairing (per person)
3. Guest fills in allergy & special requests form (see 3.5)
4. Guest provides contact details (name, email, phone)
5. System confirms booking instantly if seats available; decrements seat count
6. Confirmation sent via email (see 3.7)

#### 3.1.3a Cancellation Policy

- Guests may cancel bookings up to **48 hours** before the event start time
- Cancellations within 48 hours of the event are not permitted
- Cancelled bookings release seats back to the available pool
- Admin can cancel any booking at any time regardless of the 48-hour window

#### 3.1.4 Booking Management (Admin)

- Dashboard view of all bookings per event
- Guest list with pax count, wine pairing selections, allergy notes
- Ability to manually add walk-in or phone bookings
- Cancel booking with automatic notification to guest
- Export guest list as CSV

### 3.2 Menu System

Menus are configured per event. Each event has its own unique tasting menu.

#### 3.2.1 Menu Builder (Admin)

- Add courses in sequence: Amuse-bouche, Starter, Fish, Meat, Dessert, Petit Fours, etc.
- Each course has: course name, dish title, description, and optional dietary tags (V, VG, GF, DF)
- Drag-and-drop reordering of courses
- Optional: attach a cover photo per course
- Wine pairing: if enabled, admin can add a wine per course (name, region, tasting note)

#### 3.2.2 Menu Display (Guest)

- Elegant course-by-course presentation on the event detail page
- Wine pairing shown alongside courses if the guest has opted in
- Dietary tags displayed per dish

### 3.3 Venue Management

Since the business operates via kitchen takeovers at rotating locations, each venue is a first-class entity.

| Field | Type | Notes |
|-------|------|-------|
| Venue Name | Text | Name of the space or restaurant |
| Address | Text + Map embed | Full address with optional Google Maps embed |
| Description | Rich text | Write-up on the space: atmosphere, style, history |
| Cover Photos | Image gallery | 3–5 photos of the venue |
| Capacity | Number | Max seats at this venue |
| Kitchen Notes | Text (admin only) | Internal notes on equipment, access, etc. |

### 3.4 Past Dishes Catalogue

A visual portfolio showcasing the chef's previous work. Functions as both a marketing asset and a record of past events.

- Photo gallery grid with high-quality dish images
- Each entry: dish name, event it was served at, date, brief description
- Filter or browse by event, course type, or ingredient
- Admin uploads photos and metadata after each event
- Optional: link to the full past menu of that event

### 3.5 Allergy & Special Requests Form

Submitted by guests during the booking flow. Critical for food safety and hospitality.

| Field | Type | Notes |
|-------|------|-------|
| Common Allergies | Multi-select checkboxes | Nuts, Shellfish, Dairy, Gluten, Eggs, Soy, Sesame, Fish |
| Other Allergies | Free text | Anything not covered above |
| Dietary Restrictions | Multi-select | Vegetarian, Vegan, Pescatarian, Halal, Kosher |
| Special Requests | Free text | Celebrations, seating preferences, etc. |
| Severity | Select | Preference / Intolerance / Life-threatening allergy |

- Form is per-guest (if booking multiple seats, can fill for each person)
- Admin sees aggregated allergy summary per event on the dashboard
- Allergy data highlighted prominently in the guest list — not buried

### 3.6 Reviews & Recommendations

Social proof configured and moderated by admin. Not a public submission form — admin curates what appears.

- Admin adds reviews manually: guest name (or initials), star rating (1–5), quote, date, event reference
- Admin can feature/pin top reviews on the homepage
- Display as a testimonials carousel or grid on the public site
- Future: allow guests to submit reviews post-event via a follow-up email link, with admin approval before publishing

### 3.7 Notifications (Email Only)

| Trigger | Channel | Recipient | Content |
|---------|---------|-----------|---------|
| Booking confirmed | Email | Guest | Confirmation with event details, venue address, date/time |
| Booking cancelled | Email | Guest | Cancellation notice with reason |
| Event reminder | Email | Guest | 24 hours before the event; includes venue address |
| New booking received | Email | Admin | Summary: guest name, pax, allergies, wine pairing |
| Event sold out | Email | Admin | Notification that all seats are filled |
| Post-event follow-up | Email | Guest | Thank-you with link to review form and past dishes gallery |

---

## 4. Pricing Structure

Pricing is set per event by the admin:

| Line Item | Configured By | Displayed To Guest |
|-----------|---------------|-------------------|
| Base price per seat | Admin (per event) | Yes — shown on event card and detail page |
| Wine pairing add-on | Admin (per event, optional) | Yes — shown as optional upgrade during booking |
| Total at checkout | Calculated | Yes — (seats × base) + (wine pairings × add-on price) |
| Service fee / tax | Future | Not in MVP |

*Payment is not in MVP scope. Price display is informational. Payment collection happens outside the platform until the payment feature is built.*

---

## 5. Admin Dashboard

### 5.1 Dashboard Home

- Snapshot of the next upcoming event: date, seats booked/remaining, revenue projection
- Quick-action buttons: Create Event, View Bookings, Add Past Dish
- Recent bookings feed

### 5.2 Events Management

- List of all events (upcoming, past, draft, cancelled) with filters
- Inline status badges and seat fill indicators
- Click-through to event detail with full booking list

### 5.3 Guest CRM (Lightweight)

- List of all guests who have ever booked
- Per-guest: booking history, allergy profile, total visits
- Search and filter by name, email, allergy

---

## 6. Information Architecture

### 6.1 Public Site (Guest-Facing)

| Page | Purpose |
|------|---------|
| Home | Hero with next event, intro copy, featured reviews, past dishes preview |
| Upcoming Events | Calendar view + list of published events |
| Event Detail | Full menu, venue write-up, pricing, booking CTA |
| Past Events Gallery | Photo catalogue of past dishes |
| About | Story of the chef, the team, the philosophy |
| Book (modal/page) | Booking form: pax, wine pairing, allergies, contact info |

### 6.2 Admin Dashboard

| Section | Purpose |
|---------|---------|
| Dashboard Home | Overview snapshot, quick actions |
| Events | CRUD for events, menu builder, status management |
| Venues | CRUD for venue profiles |
| Bookings | All bookings across events, filterable |
| Past Dishes | Upload and manage the dish catalogue |
| Reviews | Add, edit, feature, hide reviews |
| Guests | Lightweight CRM, allergy aggregation |
| Settings | Notification templates, profile, branding |

---

## 7. Core Data Model

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| Event | id, title, date, time, total_seats, booked_seats, price_per_seat, wine_price, status, description, booking_deadline | belongs_to Venue; has_many Courses; has_many Bookings |
| Venue | id, name, address, description, photos, capacity, kitchen_notes | has_many Events |
| Course | id, event_id, sequence, course_type, dish_title, description, dietary_tags, photo, wine_name, wine_region, wine_note | belongs_to Event |
| Booking | id, event_id, guest_id, pax, wine_pairing_count, status, created_at | belongs_to Event; belongs_to Guest; has_many GuestDetails |
| Guest | id, name, email, phone, created_at | has_many Bookings |
| GuestDetail | id, booking_id, guest_name, allergies, dietary_restrictions, severity, special_requests | belongs_to Booking |
| Review | id, guest_name, rating, quote, event_id, is_featured, created_at | optionally belongs_to Event |
| PastDish | id, event_id, dish_name, description, course_type, photo, created_at | belongs_to Event |

---

## 8. Non-Functional Requirements

- **Mobile-first:** The guest site must be fully responsive; most guests will browse on phones
- **Performance:** Event pages load in under 2 seconds; images optimized and lazy-loaded
- **SEO:** Server-rendered pages with proper meta tags for event discovery via search
- **Accessibility:** WCAG 2.1 AA minimum; focus states, alt text, screen reader support
- **Security:** Admin dashboard behind authentication; rate limiting on booking endpoint
- **Data privacy:** Guest allergy data is sensitive; encrypt at rest, restrict access to admin only

---

## 9. Future Roadmap

| Phase | Feature | Description |
|-------|---------|-------------|
| Phase 2 | Payment integration | Stripe Checkout; collect full payment or deposit at booking |
| Phase 2 | Cancellation with deposits | Configurable refund rules tied to payment integration |
| Phase 2 | Waitlist | Guests join waitlist when sold out; notified on cancellation |
| Phase 3 | Guest accounts | Optional login; pre-filled allergy profile, booking history |
| Phase 3 | Guest review submission | Post-event email with review link; admin approval |
| Phase 3 | Multi-language support | For diverse guest base in SF |
| Phase 4 | Private event buyout | Single party books the entire event |
| Phase 4 | Gift vouchers | Purchasable gift certificates |
| Phase 4 | Analytics dashboard | Booking trends, revenue tracking, guest demographics |

---

## 10. Open Questions

1. ~~**Cancellation policy:**~~ **Resolved** — Guests may cancel up to 48 hours before the event. No-shows tracked but no financial penalty pre-payment.
2. ~~**Minimum booking size:**~~ **Resolved** — Minimum is 1 seat.
3. ~~**Branding:**~~ **Resolved** — Deferred to the final phase of development.
4. ~~**SMS provider:**~~ **Resolved** — Email-only for notifications. No SMS.
5. **Deposit vs. full payment:** When payment is added, should guests pay in full or just a deposit?
