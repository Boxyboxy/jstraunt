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

CREATE POLICY "Public can view published events"
  ON events FOR SELECT
  USING (status IN ('published', 'sold_out', 'completed'));

CREATE POLICY "Public can view courses for published events"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = courses.event_id
      AND events.status IN ('published', 'sold_out', 'completed')
    )
  );

CREATE POLICY "Public can view venues"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "Public can view visible reviews"
  ON reviews FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public can view past dishes"
  ON past_dishes FOR SELECT
  USING (true);

-- ── Public write access (booking) ──

CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can create guests"
  ON guests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can create guest details"
  ON guest_details FOR INSERT
  WITH CHECK (true);

-- ── Admin full access ──
-- Admin uses service_role key in API routes, bypassing RLS
-- No explicit admin policies needed; service_role skips RLS
