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

-- ============================================================
-- Fix create_booking: don't overwrite existing guest name
-- Only update name if the guest record has no name yet
-- Phone is preserved via COALESCE (already correct)
-- ============================================================

CREATE OR REPLACE FUNCTION create_booking(
  p_event_id UUID,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_pax INT,
  p_wine_pairing_count INT,
  p_guest_details JSONB
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
