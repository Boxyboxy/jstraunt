# Palette — Technical Design Document

**Version 1.1 · April 2026**
**Stack: Next.js 15 (App Router) + Supabase · Single Repo**

---

## 1. Architecture Overview

A single Next.js application serving both the public guest site and the admin dashboard, backed by Supabase for database, auth, storage, and edge functions.

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Hosting)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │              Next.js App Router                │  │
│  │                                               │  │
│  │  /              → Guest public site (SSR)     │  │
│  │  /events/[id]   → Event detail (SSR + ISR)    │  │
│  │  /gallery       → Past dishes (SSR)           │  │
│  │  /admin/*       → Admin dashboard (CSR)       │  │
│  │  /api/*         → API routes (serverless)     │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
└──────────────────┼───────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │      Supabase       │
        │  ┌───────────────┐  │
        │  │  PostgreSQL   │  │
        │  │  + RLS        │  │
        │  ├───────────────┤  │
        │  │  Auth         │  │
        │  ├───────────────┤  │
        │  │  Storage      │  │
        │  │  (images)     │  │
        │  ├───────────────┤  │
        │  │  Edge Funcs   │  │
        │  │  (cron jobs)  │  │
        │  └───────────────┘  │
        └─────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
    Resend                Google Maps
    (email)               (embeds)
```

### Why this architecture

- **Single repo, single deploy** — no infra to manage, fast iteration for a solo/small team
- **Next.js 15 App Router** — server components for SEO-critical guest pages, client components for the interactive admin dashboard
- **Supabase** — Postgres + auth + storage + realtime in one service; generous free tier; RLS for security without a separate API layer
- **Vercel** — zero-config deploys, automatic preview environments, edge network

---

## 1.1 Branding

**Name:** Palette
**Tagline:** Intimate tasting menu experiences at rotating venues across Singapore.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Burgundy 700 | `#5C2434` | Primary buttons, CTAs, brand accents |
| Burgundy 900 | `#3D1623` | Headings, admin sidebar, dark text |
| Gold 400 | `#D4A855` | Warning badges, highlight accents |
| Gold 100 | `#F7EDDA` | Warning badge backgrounds |
| Sage 500 | `#7B8B6F` | Success states, availability indicators |
| Sage 100 | `#E6EBE2` | Success badge backgrounds |
| Cream 100 | `#FAF7F2` | Page backgrounds |
| Cream 300 | `#EDE4D5` | Borders, dividers |
| Cream 200 | `#F5EFE6` | Card backgrounds, hover states |

### Typography

| Role | Font | Style |
|------|------|-------|
| Headings | Oswald (Google Fonts) | Semibold, uppercase, tracking-wide |
| Body | Geist Sans (default) | Regular weight, clean geometric sans-serif |
| Mono | Geist Mono | Code blocks, technical content |

Heading font is loaded via `next/font/google` and applied globally via CSS custom property `--font-heading`. All `<h1>`–`<h6>` elements inherit the heading font automatically.

### Brand Guidelines (from Palette Deck)

- **Feeling:** Intimate, warm, subtle casual luxury
- **Style:** Modern & clean, not tacky, balance tradition with minimalism
- **Visual motifs:** Checkerboard patterns, circular image crops (future consideration)
- **Admin sidebar:** Deep burgundy (`burgundy-900`) background
- **Guest site:** Warm cream backgrounds with burgundy text and gold accents

---

## 2. Repository Structure

```
palette/
├── src/
│   ├── app/
│   │   ├── (guest)/                    # Guest-facing routes (public)
│   │   │   ├── page.tsx                # Homepage
│   │   │   ├── events/
│   │   │   │   ├── page.tsx            # Upcoming events calendar
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # Event detail + booking CTA
│   │   │   ├── gallery/
│   │   │   │   └── page.tsx            # Past dishes catalogue
│   │   │   ├── about/
│   │   │   │   └── page.tsx            # About the chef/team
│   │   │   ├── book/
│   │   │   │   └── [eventId]/
│   │   │   │       └── page.tsx        # Booking flow
│   │   │   └── layout.tsx              # Guest layout (nav, footer)
│   │   │
│   │   ├── admin/                      # Admin dashboard (protected)
│   │   │   ├── page.tsx                # Dashboard home
│   │   │   ├── events/
│   │   │   │   ├── page.tsx            # Events list
│   │   │   │   ├── new/page.tsx        # Create event + menu builder
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Edit event
│   │   │   │       └── bookings/page.tsx  # Bookings for this event
│   │   │   ├── venues/
│   │   │   │   ├── page.tsx            # Venues list
│   │   │   │   └── [id]/page.tsx       # Edit venue
│   │   │   ├── dishes/
│   │   │   │   └── page.tsx            # Past dishes management
│   │   │   ├── reviews/
│   │   │   │   └── page.tsx            # Reviews management
│   │   │   ├── guests/
│   │   │   │   └── page.tsx            # Guest CRM
│   │   │   ├── settings/
│   │   │   │   └── page.tsx            # Notification templates, profile
│   │   │   └── layout.tsx              # Admin layout (sidebar, auth gate)
│   │   │
│   │   ├── api/
│   │   │   ├── bookings/
│   │   │   │   └── route.ts            # POST: create booking
│   │   │   ├── webhooks/
│   │   │   │   └── route.ts            # Incoming webhooks (future: Stripe)
│   │   │   └── cron/
│   │   │       └── reminders/route.ts  # Cron: send event reminders
│   │   │
│   │   ├── auth/
│   │   │   ├── login/page.tsx          # Admin login
│   │   │   └── callback/route.ts       # Supabase auth callback
│   │   │
│   │   ├── layout.tsx                  # Root layout
│   │   └── globals.css                 # Tailwind + custom styles
│   │
│   ├── components/
│   │   ├── guest/                      # Guest-facing components
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventCalendar.tsx
│   │   │   ├── MenuDisplay.tsx
│   │   │   ├── VenueCard.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   ├── AllergyForm.tsx
│   │   │   ├── ReviewsCarousel.tsx
│   │   │   ├── DishGallery.tsx
│   │   │   └── CountdownHero.tsx
│   │   ├── admin/                      # Admin components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── EventForm.tsx
│   │   │   ├── MenuBuilder.tsx
│   │   │   ├── VenueForm.tsx
│   │   │   ├── BookingsTable.tsx
│   │   │   ├── GuestList.tsx
│   │   │   ├── ReviewForm.tsx
│   │   │   ├── DishUploader.tsx
│   │   │   └── StatsCards.tsx
│   │   └── ui/                         # Shared primitives
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       ├── Calendar.tsx
│   │       └── ImageUpload.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client
│   │   │   ├── server.ts               # Server client (cookies)
│   │   │   ├── admin.ts                # Service role client (API routes)
│   │   │   └── middleware.ts           # Auth middleware
│   │   ├── email.ts                    # Resend integration
│   │   ├── notifications.ts           # Email notification dispatcher
│   │   ├── validators.ts              # Zod schemas for forms/API
│   │   └── utils.ts                   # Formatters, helpers
│   │
│   ├── hooks/
│   │   ├── useBooking.ts
│   │   ├── useEvents.ts
│   │   └── useSupabase.ts
│   │
│   └── types/
│       └── database.ts                 # Generated from Supabase schema
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions.sql
│   │   └── 004_cancel_booking_and_fixes.sql
│   ├── seed.sql
│   └── config.toml
│
├── emails/                             # React Email templates
│   ├── BookingConfirmation.tsx
│   ├── BookingCancellation.tsx
│   ├── EventReminder.tsx
│   └── PostEventFollowUp.tsx
│
├── public/
│   └── images/
│
├── .env.local.example
├── middleware.ts                        # Route protection
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Database Schema

All tables live in Supabase Postgres. UUIDs as primary keys. Timestamps in UTC.

### 3.1 SQL Migration: `001_initial_schema.sql`

```sql
-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE event_status AS ENUM (
  'draft', 'published', 'sold_out', 'completed', 'cancelled'
);

CREATE TYPE booking_status AS ENUM (
  'confirmed', 'cancelled', 'no_show'
);

CREATE TYPE allergy_severity AS ENUM (
  'preference', 'intolerance', 'life_threatening'
);

-- ============================================================
-- VENUES
-- ============================================================

CREATE TABLE venues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  description   TEXT,
  photos        TEXT[] DEFAULT '{}',         -- array of Storage URLs
  capacity      INT NOT NULL DEFAULT 16,
  kitchen_notes TEXT,                         -- admin-only internal notes
  map_embed_url TEXT,                         -- Google Maps embed URL
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,       -- URL-friendly identifier
  venue_id         UUID REFERENCES venues(id) ON DELETE SET NULL,
  event_date       DATE NOT NULL,
  event_time       TIME NOT NULL,
  total_seats      INT NOT NULL DEFAULT 16,
  booked_seats     INT NOT NULL DEFAULT 0,
  price_per_seat   DECIMAL(10,2) NOT NULL,
  wine_pairing     BOOLEAN DEFAULT false,
  wine_price       DECIMAL(10,2),
  status           event_status DEFAULT 'draft',
  description      TEXT,
  booking_deadline TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_seats CHECK (booked_seats >= 0 AND booked_seats <= total_seats),
  CONSTRAINT valid_wine_price CHECK (
    (wine_pairing = false) OR (wine_pairing = true AND wine_price IS NOT NULL)
  )
);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);

-- ============================================================
-- COURSES (per-event menu items)
-- ============================================================

CREATE TABLE courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sequence        INT NOT NULL,               -- display order
  course_type     TEXT NOT NULL,               -- e.g. 'Amuse-bouche', 'Starter', 'Main'
  dish_title      TEXT NOT NULL,
  description     TEXT,
  dietary_tags    TEXT[] DEFAULT '{}',          -- ['V', 'GF', 'DF']
  photo_url       TEXT,
  wine_name       TEXT,                        -- paired wine (if wine_pairing enabled)
  wine_region     TEXT,
  wine_note       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(event_id, sequence)
);

CREATE INDEX idx_courses_event ON courses(event_id);

-- ============================================================
-- GUESTS
-- ============================================================

CREATE TABLE guests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE(email)
);

CREATE INDEX idx_guests_email ON guests(email);

-- ============================================================
-- BOOKINGS
-- ============================================================

CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id            UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  pax                 INT NOT NULL DEFAULT 1,
  wine_pairing_count  INT NOT NULL DEFAULT 0,
  status              booking_status DEFAULT 'confirmed',
  total_price         DECIMAL(10,2) NOT NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_pax CHECK (pax >= 1),
  CONSTRAINT valid_wine CHECK (wine_pairing_count >= 0 AND wine_pairing_count <= pax)
);

CREATE INDEX idx_bookings_event ON bookings(event_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);

-- ============================================================
-- GUEST DETAILS (per-person allergy/dietary info within a booking)
-- ============================================================

CREATE TABLE guest_details (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  guest_name            TEXT NOT NULL,
  allergies             TEXT[] DEFAULT '{}',      -- ['Nuts', 'Shellfish']
  other_allergies       TEXT,
  dietary_restrictions  TEXT[] DEFAULT '{}',      -- ['Vegetarian', 'Halal']
  severity              allergy_severity DEFAULT 'preference',
  special_requests      TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_guest_details_booking ON guest_details(booking_id);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name   TEXT NOT NULL,                 -- display name (may be initials)
  rating       INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quote        TEXT NOT NULL,
  event_id     UUID REFERENCES events(id) ON DELETE SET NULL,
  is_featured  BOOLEAN DEFAULT false,
  is_visible   BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PAST DISHES (catalogue / portfolio)
-- ============================================================

CREATE TABLE past_dishes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID REFERENCES events(id) ON DELETE SET NULL,
  dish_name    TEXT NOT NULL,
  description  TEXT,
  course_type  TEXT,
  photo_url    TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_past_dishes_event ON past_dishes(event_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.2 SQL Migration: `002_rls_policies.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_dishes ENABLE ROW LEVEL SECURITY;

-- ── Public read access (guest site) ──

-- Guests can see published events
CREATE POLICY "Public can view published events"
  ON events FOR SELECT
  USING (status IN ('published', 'sold_out', 'completed'));

-- Guests can see courses for published events
CREATE POLICY "Public can view courses for published events"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = courses.event_id
      AND events.status IN ('published', 'sold_out', 'completed')
    )
  );

-- Guests can see venues linked to published events
CREATE POLICY "Public can view venues"
  ON venues FOR SELECT
  USING (true);  -- venues are not sensitive

-- Guests can see visible reviews
CREATE POLICY "Public can view visible reviews"
  ON reviews FOR SELECT
  USING (is_visible = true);

-- Guests can see past dishes
CREATE POLICY "Public can view past dishes"
  ON past_dishes FOR SELECT
  USING (true);

-- ── Public write access (booking) ──

-- Anyone can insert a booking (via API route with validation)
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Anyone can insert guest records (upsert on email)
CREATE POLICY "Public can create guests"
  ON guests FOR INSERT
  WITH CHECK (true);

-- Anyone can insert guest details
CREATE POLICY "Public can create guest details"
  ON guest_details FOR INSERT
  WITH CHECK (true);

-- ── Admin full access ──
-- Admin uses service_role key in API routes, bypassing RLS
-- No explicit admin policies needed; service_role skips RLS
```

### 3.3 SQL Migration: `003_functions.sql`

```sql
-- ============================================================
-- Atomic booking function
-- Handles seat decrement + booking creation in one transaction
-- ============================================================

CREATE OR REPLACE FUNCTION create_booking(
  p_event_id UUID,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_pax INT,
  p_wine_pairing_count INT,
  p_guest_details JSONB  -- array of {guest_name, allergies, dietary_restrictions, severity, special_requests, other_allergies}
)
RETURNS UUID AS $$
DECLARE
  v_event RECORD;
  v_guest_id UUID;
  v_booking_id UUID;
  v_total_price DECIMAL(10,2);
  v_detail JSONB;
BEGIN
  -- Lock the event row to prevent race conditions
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  -- Validate
  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF v_event.status != 'published' THEN
    RAISE EXCEPTION 'Event is not accepting bookings (status: %)', v_event.status;
  END IF;

  IF v_event.booking_deadline IS NOT NULL AND now() > v_event.booking_deadline THEN
    RAISE EXCEPTION 'Booking deadline has passed';
  END IF;

  IF (v_event.booked_seats + p_pax) > v_event.total_seats THEN
    RAISE EXCEPTION 'Not enough seats available. Requested: %, Available: %',
      p_pax, (v_event.total_seats - v_event.booked_seats);
  END IF;

  -- Upsert guest — preserve existing name, only fill if missing
  INSERT INTO guests (name, email, phone)
  VALUES (p_guest_name, p_guest_email, p_guest_phone)
  ON CONFLICT (email) DO UPDATE SET
    name = COALESCE(NULLIF(guests.name, ''), EXCLUDED.name),
    phone = COALESCE(EXCLUDED.phone, guests.phone)
  RETURNING id INTO v_guest_id;

  -- Calculate price
  v_total_price := (p_pax * v_event.price_per_seat)
    + (p_wine_pairing_count * COALESCE(v_event.wine_price, 0));

  -- Create booking
  INSERT INTO bookings (event_id, guest_id, pax, wine_pairing_count, total_price)
  VALUES (p_event_id, v_guest_id, p_pax, p_wine_pairing_count, v_total_price)
  RETURNING id INTO v_booking_id;

  -- Insert guest details
  FOR v_detail IN SELECT * FROM jsonb_array_elements(p_guest_details)
  LOOP
    INSERT INTO guest_details (
      booking_id, guest_name, allergies, other_allergies,
      dietary_restrictions, severity, special_requests
    ) VALUES (
      v_booking_id,
      v_detail->>'guest_name',
      ARRAY(SELECT jsonb_array_elements_text(v_detail->'allergies')),
      v_detail->>'other_allergies',
      ARRAY(SELECT jsonb_array_elements_text(v_detail->'dietary_restrictions')),
      (v_detail->>'severity')::allergy_severity,
      v_detail->>'special_requests'
    );
  END LOOP;

  -- Increment booked seats
  UPDATE events
  SET booked_seats = booked_seats + p_pax,
      status = CASE
        WHEN (booked_seats + p_pax) >= total_seats THEN 'sold_out'::event_status
        ELSE status
      END
  WHERE id = p_event_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Cancel booking function
-- Enforces 48-hour cancellation policy for guests
-- Admin can cancel any booking regardless of time window
-- ============================================================

CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_is_admin BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
DECLARE
  v_booking RECORD;
  v_event RECORD;
BEGIN
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking is already cancelled';
  END IF;

  SELECT * INTO v_event
  FROM events
  WHERE id = v_booking.event_id;

  -- Enforce 48-hour cancellation policy for non-admin
  IF NOT p_is_admin THEN
    IF (v_event.event_date + v_event.event_time) - INTERVAL '48 hours' <= now() THEN
      RAISE EXCEPTION 'Cancellations must be made at least 48 hours before the event';
    END IF;
  END IF;

  -- Cancel the booking
  UPDATE bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  -- Release seats
  UPDATE events
  SET booked_seats = booked_seats - v_booking.pax,
      status = CASE
        WHEN status = 'sold_out' THEN 'published'::event_status
        ELSE status
      END
  WHERE id = v_booking.event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. API Design

All API routes live under `src/app/api/`. Admin routes use Supabase service role; public routes use anon key with RLS.

### 4.1 Public API Routes

#### `POST /api/bookings`

The critical path. Calls the `create_booking` database function for atomicity.

```typescript
// src/app/api/bookings/route.ts

import { createAdminClient } from '@/lib/supabase/admin'
import { bookingSchema } from '@/lib/validators'
import { sendBookingConfirmation, notifyAdminNewBooking } from '@/lib/notifications'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()

  // Validate with Zod
  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid booking data', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('create_booking', {
    p_event_id: parsed.data.eventId,
    p_guest_name: parsed.data.guestName,
    p_guest_email: parsed.data.guestEmail,
    p_guest_phone: parsed.data.guestPhone,
    p_pax: parsed.data.pax,
    p_wine_pairing_count: parsed.data.winePairingCount,
    p_guest_details: parsed.data.guestDetails,
  })

  if (error) {
    // Map DB errors to user-friendly messages
    if (error.message.includes('Not enough seats')) {
      return NextResponse.json({ error: 'Not enough seats available' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
  }

  const bookingId = data

  // Fire-and-forget email notifications (don't block response)
  Promise.allSettled([
    sendBookingConfirmation(bookingId),
    notifyAdminNewBooking(bookingId),
  ])

  return NextResponse.json({ bookingId }, { status: 201 })
}
```

#### `GET /api/cron/reminders`

Triggered by Vercel Cron (configured in `vercel.json`). Sends reminders 24h before events.

```typescript
// src/app/api/cron/reminders/route.ts

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()

  // Find events happening in the next 24-26 hours
  const tomorrow = new Date()
  tomorrow.setHours(tomorrow.getHours() + 24)
  const windowEnd = new Date()
  windowEnd.setHours(windowEnd.getHours() + 26)

  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('status', 'published')
    .gte('event_date', tomorrow.toISOString().split('T')[0])
    .lte('event_date', windowEnd.toISOString().split('T')[0])

  // Send reminders for each event's bookings
  for (const event of events ?? []) {
    await sendEventReminders(event.id)
  }

  return Response.json({ sent: events?.length ?? 0 })
}
```

### 4.2 Data Fetching Pattern (Server Components)

Guest pages use server components with direct Supabase queries — no API routes needed.

```typescript
// src/app/(guest)/events/[id]/page.tsx

import { createServerClient } from '@/lib/supabase/server'

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data: event } = await supabase
    .from('events')
    .select(`
      *,
      venue:venues(*),
      courses(* ORDER BY sequence ASC)
    `)
    .eq('slug', params.id)
    .single()

  if (!event) notFound()

  const seatsRemaining = event.total_seats - event.booked_seats

  return <EventDetail event={event} seatsRemaining={seatsRemaining} />
}
```

### 4.3 Admin Data Mutations

Admin pages use Server Actions for mutations. All admin actions use the service role client.

```typescript
// src/app/admin/events/actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { eventSchema } from '@/lib/validators'
import { revalidatePath } from 'next/cache'

export async function createEvent(formData: FormData) {
  // Auth check
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const parsed = eventSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Invalid data')

  const supabase = createAdminClient()
  const { error } = await supabase.from('events').insert(parsed.data)
  if (error) throw error

  revalidatePath('/admin/events')
  revalidatePath('/events')
}
```

---

## 5. Authentication

Admin-only authentication using Supabase Auth. No guest accounts in MVP.

### 5.1 Strategy

- **Method:** Email + password (magic link optional)
- **Scope:** Only admin users can log in. No public signup.
- **Admin users:** Pre-created in Supabase dashboard (2–3 team members)

### 5.2 Middleware

```typescript
// middleware.ts

import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)

  const { data: { session } } = await supabase.auth.getSession()

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

---

## 6. File Storage

Supabase Storage for all images. Two buckets:

| Bucket | Access | Content |
|--------|--------|---------|
| `venue-photos` | Public | Venue cover photos and gallery |
| `dish-photos` | Public | Course photos and past dishes catalogue |

### Upload Pattern (Admin)

```typescript
// src/lib/storage.ts

export async function uploadImage(
  bucket: 'venue-photos' | 'dish-photos',
  file: File,
  path: string
): Promise<string> {
  const supabase = createAdminClient()

  const ext = file.name.split('.').pop()
  const filePath = `${path}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '31536000',  // 1 year cache
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
```

### Image Optimization

Next.js `<Image>` component handles resizing and format conversion automatically when using `next/image` with Supabase Storage URLs added to `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
```

---

## 7. Notifications (Email Only)

All notifications are sent via email using Resend + React Email. No SMS in scope.

### 7.1 Email (Resend + React Email)

```typescript
// src/lib/email.ts

import { Resend } from 'resend'
import BookingConfirmation from '@/emails/BookingConfirmation'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingConfirmationEmail(booking: BookingWithDetails) {
  await resend.emails.send({
    from: 'Palette <hello@yourdomain.com>',
    to: booking.guest.email,
    subject: `Booking Confirmed — ${booking.event.title}`,
    react: BookingConfirmation({ booking }),
  })
}
```

### 7.2 Notification Dispatcher

```typescript
// src/lib/notifications.ts

export async function sendBookingConfirmation(bookingId: string) {
  const booking = await fetchBookingWithDetails(bookingId)
  await sendBookingConfirmationEmail(booking)
}
```

### 7.4 Cron Schedule (Vercel)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

---

## 8. Validation (Zod Schemas)

Shared between client forms and API routes.

```typescript
// src/lib/validators.ts

import { z } from 'zod'

export const guestDetailSchema = z.object({
  guest_name: z.string().min(1, 'Name is required'),
  allergies: z.array(z.string()).default([]),
  other_allergies: z.string().optional(),
  dietary_restrictions: z.array(z.string()).default([]),
  severity: z.enum(['preference', 'intolerance', 'life_threatening']).default('preference'),
  special_requests: z.string().optional(),
})

export const bookingSchema = z.object({
  eventId: z.string().uuid(),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  pax: z.number().int().min(1).max(16),  // minimum booking size: 1
  winePairingCount: z.number().int().min(0),
  guestDetails: z.array(guestDetailSchema).min(1),
}).refine(
  (data) => data.guestDetails.length === data.pax,
  { message: 'Must provide details for each guest' }
).refine(
  (data) => data.winePairingCount <= data.pax,
  { message: 'Wine pairings cannot exceed party size' }
)

export const eventSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  venue_id: z.string().uuid(),
  event_date: z.string(),
  event_time: z.string(),
  total_seats: z.number().int().min(1).max(30),
  price_per_seat: z.number().positive(),
  wine_pairing: z.boolean().default(false),
  wine_price: z.number().positive().optional(),
  description: z.string().optional(),
  booking_deadline: z.string().optional(),
})
```

---

## 9. Key UI Components

### 9.1 Booking Form (Guest)

Multi-step form using client-side state:

```
Step 1: Select pax + wine pairing
Step 2: Allergy & dietary form (one per guest)
Step 3: Contact details (name, email, phone)
Step 4: Review & confirm
```

State managed with `useReducer`. Each step validates before advancing. On submit, POST to `/api/bookings`.

### 9.2 Event Calendar (Guest)

A monthly calendar grid showing event dots. Clicking a date navigates to the event detail. Built with `react-day-picker` or a custom component using CSS Grid.

### 9.3 Menu Builder (Admin)

Collapsible course list with move-up/move-down reordering. Each course is an inline-editable card with fields for course type, dish title, description, dietary tags, and optional wine pairing.

### 9.4 Admin Dashboard Home

Cards layout showing: next event summary (date, fill rate, projected revenue), recent bookings feed, and quick-action buttons.

---

## 10. Environment Variables

```bash
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email (Resend)
RESEND_API_KEY=re_xxx

# Cron
CRON_SECRET=xxx

# Google Maps (optional)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=xxx
```

---

## 11. Deployment

### 11.1 Vercel

- Connect GitHub repo → auto-deploys on push to `main`
- Preview deployments on PRs
- Environment variables set in Vercel dashboard
- Edge network serves static assets; serverless functions handle API routes

### 11.2 Supabase

- Local dev: `supabase start` (Docker-based local instance)
- Migrations: `supabase db push` to apply schema changes
- Type generation: `supabase gen types typescript --local > src/types/database.ts`

### 11.3 CI/CD Pipeline

```
Push to main
  → Vercel builds Next.js
  → Runs `supabase gen types` (optional CI step)
  → Deploys to production

Push to feature branch
  → Vercel creates preview deployment
  → Preview uses staging Supabase project
```

---

## 12. Performance Considerations

- **SSR + ISR** for guest pages: event detail pages revalidate every 60 seconds (seat count stays fresh without real-time overhead)
- **Client-side optimistic updates** for admin: show the change immediately, roll back on error
- **Image optimization** via Next.js Image component: auto WebP/AVIF, lazy loading, responsive sizes
- **Database indexing** on `events.event_date`, `events.status`, `bookings.event_id`, `guests.email`
- **Connection pooling** via Supabase's built-in PgBouncer (use the pooler URL in production)

---

## 13. Security

- **RLS** on all tables: guests can only read published data; writes go through validated API routes
- **Service role key** never exposed to the client; only used in API routes and server actions
- **Rate limiting** on `/api/bookings`: implement via Vercel Edge Middleware or `upstash/ratelimit` (e.g., 5 bookings per IP per minute)
- **Input validation** with Zod on every API route and server action
- **CSRF** handled by Next.js server actions natively
- **Allergy data** treated as sensitive PII: encrypted at rest by Supabase, no client-side caching

---

## 14. Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Validators, utility functions, price calculations |
| Component | React Testing Library | Booking form steps, calendar, menu display |
| Integration | Vitest + Supabase local | Booking flow end-to-end, seat counting, RLS policies |
| E2E | Playwright | Full booking flow, admin event creation, guest list export |

Priority for MVP: focus on integration tests for the booking function (race conditions, seat overflow, validation) and E2E for the happy-path booking flow.

---

## 15. Development Phases

### Phase 1 — Foundation (Week 1–2)

- Repo setup: Next.js + Tailwind + Supabase
- Database schema + migrations + seed data
- Supabase auth for admin login
- Basic admin layout with sidebar navigation

### Phase 2 — Admin Core (Week 3–4)

- Venue CRUD
- Event CRUD with menu builder
- Image upload to Supabase Storage
- Reviews management

### Phase 3 — Guest Site (Week 5–6)

- Homepage with hero, featured reviews, past dishes preview
- Events calendar page
- Event detail page with menu display and venue write-up
- Past dishes gallery

### Phase 4 — Booking Flow (Week 7–8)

- Multi-step booking form with allergy/dietary collection
- `create_booking` and `cancel_booking` RPCs + API routes
- 48-hour cancellation policy enforcement
- Seat availability checking + optimistic UI
- Email notifications via Resend

### Phase 5 — Polish & Launch (Week 9–10)

- Admin bookings dashboard + guest list + CSV export
- Guest CRM page
- Event reminder cron job
- Mobile responsive pass
- SEO meta tags + OG images
- Testing + bug fixes
- Production deploy

---

## 16. Dependencies

```json
{
  "dependencies": {
    "next": "^15.0",
    "react": "^19.0",
    "@supabase/supabase-js": "^2.45",
    "@supabase/ssr": "^0.5",
    "resend": "^4.0",
    "zod": "^3.23",
    "react-day-picker": "^9.0",
    "date-fns": "^3.6",
    "lucide-react": "^0.400"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "tailwindcss": "^3.4",
    "supabase": "^1.190",
    "vitest": "^2.0",
    "@testing-library/react": "^16.0",
    "playwright": "^1.45"
  }
}
```
