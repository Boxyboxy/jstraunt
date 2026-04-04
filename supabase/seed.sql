-- ============================================================
-- SEED DATA
-- ============================================================

-- Venues
INSERT INTO venues (id, name, address, description, capacity, kitchen_notes) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'The Loft on Valencia', '742 Valencia St, San Francisco, CA 94110', 'An intimate loft space with exposed brick walls and warm lighting. The open kitchen allows guests to watch the culinary team at work while enjoying their meal.', 14, 'Full commercial kitchen. Gas range with 6 burners. Two ovens. Plenty of counter space. Street parking only.'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Sunset Kitchen', '1280 9th Ave, San Francisco, CA 94122', 'A cozy neighborhood kitchen near Golden Gate Park. Floor-to-ceiling windows flood the space with natural light during golden hour.', 12, 'Residential kitchen — bring portable induction burners. One oven. Small fridge. Access via back alley.'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'The Barrel Room', '55 Mint St, San Francisco, CA 94103', 'A converted wine cellar in SoMa with vaulted ceilings and candlelit ambiance. Perfect for an evening of fine dining and conversation.', 16, 'Full kitchen downstairs. Wine storage on-site. Loading dock access for equipment.');

-- Events
INSERT INTO events (id, title, slug, venue_id, event_date, event_time, total_seats, booked_seats, price_per_seat, wine_pairing, wine_price, status, description, booking_deadline) VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 'Spring Omakase at The Loft', 'spring-omakase-loft', 'a1b2c3d4-0001-4000-8000-000000000001', '2026-04-18', '19:00', 14, 6, 185.00, true, 75.00, 'published', 'A celebration of spring produce from local farms. Seven courses exploring the season''s best, from tender pea shoots to wild morels.', '2026-04-17 12:00:00+00'),
  ('b1b2c3d4-0002-4000-8000-000000000002', 'Sunset Supper: Coastal Catch', 'sunset-supper-coastal', 'a1b2c3d4-0002-4000-8000-000000000002', '2026-04-25', '18:30', 12, 0, 165.00, true, 65.00, 'published', 'An evening dedicated to the Pacific coast. Sustainably sourced seafood, prepared with Japanese and Californian techniques.', '2026-04-24 12:00:00+00'),
  ('b1b2c3d4-0003-4000-8000-000000000003', 'The Barrel Room: Fire & Smoke', 'barrel-room-fire-smoke', 'a1b2c3d4-0003-4000-8000-000000000003', '2026-05-02', '19:30', 16, 16, 195.00, true, 85.00, 'sold_out', 'An exploration of open-flame cooking and smoke. Wagyu, whole fish, and seasonal vegetables over binchotan charcoal.', '2026-05-01 12:00:00+00'),
  ('b1b2c3d4-0004-4000-8000-000000000004', 'Garden to Table: Spring Edition', 'garden-to-table-spring', 'a1b2c3d4-0001-4000-8000-000000000001', '2026-05-09', '19:00', 14, 0, 175.00, false, NULL, 'draft', 'A fully plant-forward tasting menu showcasing hyper-local produce. Each course highlights a single hero ingredient.', NULL);

-- Courses for Spring Omakase
INSERT INTO courses (event_id, sequence, course_type, dish_title, description, dietary_tags, wine_name, wine_region, wine_note) VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 1, 'Amuse-bouche', 'Pea Shoot Consommé', 'Crystal-clear broth with English pea tendrils and lemon oil', '{"GF", "DF", "V"}', 'NV Crémant d''Alsace', 'Alsace, France', 'Bright and crisp with fine bubbles'),
  ('b1b2c3d4-0001-4000-8000-000000000001', 2, 'Starter', 'Hamachi Crudo', 'Yellowtail with yuzu kosho, shaved radish, and microgreens', '{"GF", "DF"}', '2024 Sancerre', 'Loire Valley, France', 'Mineral-driven with citrus notes'),
  ('b1b2c3d4-0001-4000-8000-000000000001', 3, 'Fish', 'Wild Morel & Black Cod', 'Miso-glazed black cod with sautéed morels and fiddlehead ferns', '{"GF"}', '2023 Meursault', 'Burgundy, France', 'Rich and buttery with hazelnut undertones'),
  ('b1b2c3d4-0001-4000-8000-000000000001', 4, 'Meat', 'Spring Lamb Saddle', 'Herb-crusted lamb with fava bean purée, charred ramps, and lamb jus', '{"GF"}', '2021 Barbaresco', 'Piedmont, Italy', 'Elegant tannins with rose and tar'),
  ('b1b2c3d4-0001-4000-8000-000000000001', 5, 'Palate Cleanser', 'Strawberry Shiso Granita', 'Fresh strawberry ice with shiso leaf and a touch of sake', '{"GF", "DF", "V", "VG"}', NULL, NULL, NULL),
  ('b1b2c3d4-0001-4000-8000-000000000001', 6, 'Dessert', 'Matcha Panna Cotta', 'Ceremonial-grade matcha custard with black sesame tuile and mochi', '{"GF", "V"}', '2022 Moscato d''Asti', 'Piedmont, Italy', 'Lightly sparkling with stone fruit sweetness'),
  ('b1b2c3d4-0001-4000-8000-000000000001', 7, 'Petit Fours', 'Mignardises', 'Yuzu marshmallow, hojicha truffle, and candied ginger', '{"GF", "V"}', NULL, NULL, NULL);

-- Guests
INSERT INTO guests (id, name, email, phone) VALUES
  ('c1b2c3d4-0001-4000-8000-000000000001', 'Sarah Chen', 'sarah.chen@example.com', '+14155551234'),
  ('c1b2c3d4-0002-4000-8000-000000000002', 'Marcus Johnson', 'marcus.j@example.com', '+14155555678'),
  ('c1b2c3d4-0003-4000-8000-000000000003', 'Emily Nakamura', 'emily.n@example.com', NULL);

-- Bookings for Spring Omakase
INSERT INTO bookings (id, event_id, guest_id, pax, wine_pairing_count, status, total_price) VALUES
  ('d1b2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 'c1b2c3d4-0001-4000-8000-000000000001', 2, 2, 'confirmed', 520.00),
  ('d1b2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0001-4000-8000-000000000001', 'c1b2c3d4-0002-4000-8000-000000000002', 4, 2, 'confirmed', 890.00);

-- Guest details
INSERT INTO guest_details (booking_id, guest_name, allergies, dietary_restrictions, severity, special_requests) VALUES
  ('d1b2c3d4-0001-4000-8000-000000000001', 'Sarah Chen', '{}', '{}', 'preference', 'Anniversary dinner — any special touches appreciated!'),
  ('d1b2c3d4-0001-4000-8000-000000000001', 'David Chen', '{"Shellfish"}', '{}', 'life_threatening', NULL),
  ('d1b2c3d4-0002-4000-8000-000000000002', 'Marcus Johnson', '{}', '{}', 'preference', NULL),
  ('d1b2c3d4-0002-4000-8000-000000000002', 'Lisa Park', '{"Nuts"}', '{}', 'intolerance', NULL),
  ('d1b2c3d4-0002-4000-8000-000000000002', 'James Kim', '{}', '{"Pescatarian"}', 'preference', NULL),
  ('d1b2c3d4-0002-4000-8000-000000000002', 'Amy Wu', '{"Dairy"}', '{"Vegetarian"}', 'intolerance', 'Seated next to James please');

-- Reviews
INSERT INTO reviews (guest_name, rating, quote, event_id, is_featured, is_visible) VALUES
  ('A.K.', 5, 'Absolutely extraordinary. Every course was a work of art. The wine pairings elevated the entire experience to another level.', 'b1b2c3d4-0003-4000-8000-000000000003', true, true),
  ('M.J.', 5, 'The best dining experience I''ve had in San Francisco. Intimate, personal, and the food was world-class.', 'b1b2c3d4-0001-4000-8000-000000000001', true, true),
  ('S.L.', 4, 'Beautiful meal from start to finish. The morel and black cod dish was unforgettable. Will definitely be back.', 'b1b2c3d4-0001-4000-8000-000000000001', false, true),
  ('R.P.', 5, 'We booked for my wife''s birthday and they went above and beyond. The team made us feel so welcome. Can''t wait for the next event.', NULL, true, true);
