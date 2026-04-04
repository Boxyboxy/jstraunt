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

  -- Upsert guest
  INSERT INTO guests (name, email, phone)
  VALUES (p_guest_name, p_guest_email, p_guest_phone)
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
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
