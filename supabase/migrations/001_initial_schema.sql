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
  photos        TEXT[] DEFAULT '{}',
  capacity      INT NOT NULL DEFAULT 16,
  kitchen_notes TEXT,
  map_embed_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
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
  sequence        INT NOT NULL,
  course_type     TEXT NOT NULL,
  dish_title      TEXT NOT NULL,
  description     TEXT,
  dietary_tags    TEXT[] DEFAULT '{}',
  photo_url       TEXT,
  wine_name       TEXT,
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
  allergies             TEXT[] DEFAULT '{}',
  other_allergies       TEXT,
  dietary_restrictions  TEXT[] DEFAULT '{}',
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
  guest_name   TEXT NOT NULL,
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
