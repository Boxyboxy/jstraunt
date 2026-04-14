-- ============================================================
-- Palette Demo Seed Script
-- Run via: Supabase SQL Editor, or `supabase db execute < supabase/demo_seed.sql`
--
-- INSTRUCTIONS:
--   1. Change `demo_date` on the line marked CONFIGURE below
--   2. Run the entire script — it is fully idempotent (safe to re-run)
--   3. All demo rows use fixed UUIDs and name prefixes so they can
--      be cleanly identified and wiped on each run
--
-- WHAT IT SEEDS:
--   • 1 venue (The Black Marble, Bukit Timah)
--   • 4 events: +7d (partially booked), +14d (nearly full), +28d (just opened), -7d (completed)
--   • Full 6–7 course menus with wine pairings for each event
--   • 5 demo guests + 4 bookings (8 seats on event 1) with guest dietary details
--   • 6 featured reviews (for homepage carousel)
--   • 10 past dishes (for gallery page)
-- ============================================================

DO $$
DECLARE
  -- ============================================================
  -- CONFIGURE: Change this date before each demo run
  -- ============================================================
  demo_date DATE := '2026-04-19';

  -- Fixed demo UUIDs — all valid UUID v4 format, clearly demo-prefixed
  v_venue_1    UUID := 'dd000000-0000-4000-a000-000000000001';

  v_event_1    UUID := 'ee000000-0000-4000-a000-000000000001'; -- upcoming +7d
  v_event_2    UUID := 'ee000000-0000-4000-a000-000000000002'; -- upcoming +14d (nearly full)
  v_event_3    UUID := 'ee000000-0000-4000-a000-000000000003'; -- upcoming +28d (just opened)
  v_event_past UUID := 'ee000000-0000-4000-a000-000000000004'; -- completed -7d (reviews + gallery)

  v_guest_1    UUID := 'ff000000-0000-4000-a000-000000000001';
  v_guest_2    UUID := 'ff000000-0000-4000-a000-000000000002';
  v_guest_3    UUID := 'ff000000-0000-4000-a000-000000000003';
  v_guest_4    UUID := 'ff000000-0000-4000-a000-000000000004';
  v_guest_5    UUID := 'ff000000-0000-4000-a000-000000000005';

  v_booking_1  UUID := 'cc000000-0000-4000-a000-000000000001';
  v_booking_2  UUID := 'cc000000-0000-4000-a000-000000000002';
  v_booking_3  UUID := 'cc000000-0000-4000-a000-000000000003';
  v_booking_4  UUID := 'cc000000-0000-4000-a000-000000000004';

BEGIN

  -- ============================================================
  -- CLEANUP: wipe all demo data before re-seeding
  -- ============================================================
  DELETE FROM guest_details WHERE booking_id IN (v_booking_1, v_booking_2, v_booking_3, v_booking_4);
  DELETE FROM bookings      WHERE id IN (v_booking_1, v_booking_2, v_booking_3, v_booking_4);
  DELETE FROM guests        WHERE id IN (v_guest_1, v_guest_2, v_guest_3, v_guest_4, v_guest_5);
  DELETE FROM courses       WHERE event_id IN (v_event_1, v_event_2, v_event_3, v_event_past);
  DELETE FROM past_dishes   WHERE event_id IN (v_event_1, v_event_2, v_event_3, v_event_past)
                               OR dish_name LIKE '[DEMO]%';
  DELETE FROM reviews       WHERE guest_name LIKE '[DEMO]%';
  DELETE FROM events        WHERE id IN (v_event_1, v_event_2, v_event_3, v_event_past);
  DELETE FROM venues        WHERE id = v_venue_1;

  -- ============================================================
  -- VENUE
  -- ============================================================
  INSERT INTO venues (id, name, address, description, capacity, kitchen_notes)
  VALUES (
    v_venue_1,
    'The Black Marble',
    '12 Greenwood Avenue, Bukit Timah, Singapore 289218',
    'A restored heritage bungalow tucked within lush Bukit Timah greenery. The Black Marble seats up to 16 guests across a single long table, with an open kitchen that lets you watch each course take shape. Dark marble surfaces, warm candlelight, and curated tableware set the tone for an unhurried evening.',
    16,
    'Full induction kitchen. No gas. Good ventilation. Cold room accessible from prep area. Owner requests guests avoid strong perfumes — noted in confirmation email.'
  );

  -- ============================================================
  -- EVENTS
  -- ============================================================

  -- Event 1: An Ode to the Soil — +7 days, partially booked (8/16)
  INSERT INTO events (id, title, slug, venue_id, event_date, event_time,
                      total_seats, booked_seats, price_per_seat,
                      wine_pairing, wine_price, status, description, booking_deadline)
  VALUES (
    v_event_1,
    'An Ode to the Soil',
    'demo-ode-to-the-soil-' || to_char(demo_date + 7, 'YYYYMMDD'),
    v_venue_1,
    demo_date + 7, '19:30',
    16, 8,
    288.00, true, 68.00,
    'published',
    'A six-course journey through the garden — root vegetables, foraged herbs, and aged ferments brought to the table at their quiet, unhurried best. Each dish celebrates what grows beneath the surface: earthy, grounding, and quietly surprising.',
    (demo_date + 5)::TIMESTAMPTZ + INTERVAL '23 hours 59 minutes'
  );

  -- Event 2: Umami Reverie — +14 days, nearly sold out (14/16)
  INSERT INTO events (id, title, slug, venue_id, event_date, event_time,
                      total_seats, booked_seats, price_per_seat,
                      wine_pairing, wine_price, status, description, booking_deadline)
  VALUES (
    v_event_2,
    'Umami Reverie',
    'demo-umami-reverie-' || to_char(demo_date + 14, 'YYYYMMDD'),
    v_venue_1,
    demo_date + 14, '19:00',
    16, 14,
    268.00, false, NULL,
    'published',
    'Six courses built around the fifth taste — kombu, aged miso, ikura, and slow-braised proteins that collapse into deep savoury clarity. A Japanese-inflected menu that finds intensity without noise.',
    (demo_date + 12)::TIMESTAMPTZ + INTERVAL '23 hours 59 minutes'
  );

  -- Event 3: Coastal Drift — +28 days, just opened (2/16)
  INSERT INTO events (id, title, slug, venue_id, event_date, event_time,
                      total_seats, booked_seats, price_per_seat,
                      wine_pairing, wine_price, status, description, booking_deadline)
  VALUES (
    v_event_3,
    'Coastal Drift',
    'demo-coastal-drift-' || to_char(demo_date + 28, 'YYYYMMDD'),
    v_venue_1,
    demo_date + 28, '19:30',
    16, 2,
    318.00, true, 88.00,
    'published',
    'Seven courses drawn from the coastline — raw shellfish, smoked crustaceans, whole-roasted fish, and a finale that drifts between sea salt and citrus. Our most ambitious seasonal menu to date.',
    (demo_date + 26)::TIMESTAMPTZ + INTERVAL '23 hours 59 minutes'
  );

  -- Event past: The Spring Gathering — -7 days, completed (16/16)
  -- Used as event reference for reviews and past dishes gallery
  INSERT INTO events (id, title, slug, venue_id, event_date, event_time,
                      total_seats, booked_seats, price_per_seat,
                      wine_pairing, wine_price, status, description, booking_deadline)
  VALUES (
    v_event_past,
    'The Spring Gathering',
    'demo-spring-gathering-' || to_char(demo_date - 7, 'YYYYMMDD'),
    v_venue_1,
    demo_date - 7, '19:30',
    16, 16,
    258.00, true, 58.00,
    'completed',
    'A celebration of the season''s first harvest — bright, green, and tender. Eight courses that traced the arc from first warmth to full bloom.',
    (demo_date - 9)::TIMESTAMPTZ + INTERVAL '23 hours 59 minutes'
  );

  -- ============================================================
  -- COURSES — Event 1: An Ode to the Soil (6 courses, wine paired)
  -- ============================================================
  INSERT INTO courses (event_id, sequence, course_type, dish_title, description, dietary_tags, wine_name, wine_region, wine_note) VALUES
    (v_event_1, 1, 'Amuse-bouche',
      'Kombu Dashi Sphere',
      'A one-bite burst of cold ocean broth, encased in a delicate agar shell. Served on crushed ice.',
      ARRAY['GF', 'V', 'DF'],
      'Pierre Moncuit Blanc de Blancs NV', 'Champagne, France',
      'High acidity and chalky minerality to open the palate.'),

    (v_event_1, 2, 'Cold Starter',
      'Beetroot Carpaccio, Goat Curd, Walnut Praline',
      'Paper-thin heritage beetroot, house-cultured goat curd, walnut praline, dressed with aged sherry vinegar.',
      ARRAY['GF', 'V'],
      'Domaine Weinbach Riesling Cuvée Théo', 'Alsace, France',
      'Stone fruit and floral aromatics to complement the earthy beet.'),

    (v_event_1, 3, 'Warm Starter',
      'Roasted Celeriac Velouté, Black Truffle Oil',
      'Silken velouté of fire-roasted celeriac, finished with Périgord truffle oil and crispy shallots.',
      ARRAY['GF', 'V'],
      'Domaine Leflaive Burgundy Chardonnay', 'Burgundy, France',
      'Creamy texture with toasted hazelnut notes — a natural bridge to the truffle.'),

    (v_event_1, 4, 'Fish',
      'Barramundi, Cauliflower Purée, Caper Beurre Blanc',
      'Wild-caught Singapore barramundi, pan-roasted skin-side down until golden. Cauliflower purée, bright caper beurre blanc.',
      ARRAY['GF'],
      'Henri Bourgeois Sancerre Blanc', 'Loire Valley, France',
      'Bright citrus and grassy minerality to lift the delicate fish.'),

    (v_event_1, 5, 'Main',
      'Wagyu Short Rib, Smoked Potato, Morel Jus',
      '48-hour sous-vide wagyu short rib, finished over binchotan. Smoked Russet potato, morel and red wine jus reduced for six hours.',
      ARRAY['GF', 'DF'],
      'Rossignol-Trapet Gevrey-Chambertin', 'Burgundy, France',
      'Dark fruit, iron, and forest floor — mirrors the morel jus beautifully.'),

    (v_event_1, 6, 'Dessert',
      'Dark Chocolate Tart, Sea Salt, Espresso Gel',
      '72% Valrhona ganache in a buttery tart shell. Smoked sea salt flakes, espresso gel, micro herbs for brightness.',
      ARRAY['V'],
      'Domaine du Mas Blanc Banyuls Rimage', 'Roussillon, France',
      'Fortified and sweet with dark fruit — a classic pairing for bitter chocolate.');

  -- ============================================================
  -- COURSES — Event 2: Umami Reverie (6 courses, no wine pairing)
  -- ============================================================
  INSERT INTO courses (event_id, sequence, course_type, dish_title, description, dietary_tags) VALUES
    (v_event_2, 1, 'Amuse-bouche',
      'Dashi Custard, Ikura, Chive',
      'Soft-steamed chawanmushi of kombu and bonito dashi, crowned with Hokkaido ikura and snipped chives.',
      ARRAY['GF', 'DF']),

    (v_event_2, 2, 'Cold Starter',
      'Hamachi Crudo, Yuzu Kosho, Cucumber',
      'Thin-sliced yellowtail dressed with house-made yuzu kosho, cucumber water, and Okinawan sea salt.',
      ARRAY['GF', 'DF']),

    (v_event_2, 3, 'Warm Starter',
      'Miso Butternut Velouté, Crispy Tofu, Sesame',
      'White miso caramelised with butternut squash, blended to a velvety soup. Topped with house-fried silken tofu and toasted sesame oil.',
      ARRAY['GF', 'V', 'DF']),

    (v_event_2, 4, 'Fish',
      'Steamed Sea Bass, Ginger Scallion Oil, Aged Soy',
      'Whole-fillet sea bass steamed to the moment of translucency. Ginger, spring onion, smoking-hot oil, four-year aged soy.',
      ARRAY['GF', 'DF']),

    (v_event_2, 5, 'Main',
      'Iberico Pork Collar, Kimchi Purée, Sesame Jus',
      'Iberico pork collar brined for 24 hours and slow-roasted. House-fermented kimchi purée, sesame and pork-bone jus.',
      ARRAY['GF', 'DF']),

    (v_event_2, 6, 'Dessert',
      'Black Sesame Parfait, Yuzu Curd, Rice Cracker',
      'Frozen black sesame parfait alongside a sharp yuzu curd and a shatter of puffed rice cracker.',
      ARRAY['V', 'DF']);

  -- ============================================================
  -- COURSES — Event 3: Coastal Drift (7 courses, wine paired)
  -- ============================================================
  INSERT INTO courses (event_id, sequence, course_type, dish_title, description, dietary_tags, wine_name, wine_region, wine_note) VALUES
    (v_event_3, 1, 'Amuse-bouche',
      'Oyster, Green Apple Granita, Cucumber Jelly',
      'A single Coffin Bay oyster, shucked to order. Green apple granita melting on top, cucumber jelly underneath.',
      ARRAY['GF', 'DF'],
      'Luneau-Papin Muscadet Sèvre et Maine sur Lie', 'Loire Valley, France',
      'Saline and mineral — almost as briny as the oyster itself.'),

    (v_event_3, 2, 'Cold Starter',
      'Lobster Tartare, Avocado, Ponzu Gel',
      'Hand-chopped Boston lobster tail, cubed avocado, crispy shallots, and a firm ponzu gel.',
      ARRAY['GF', 'DF'],
      'William Fèvre Chablis Premier Cru Montée de Tonnerre', 'Chablis, France',
      'Flinty and tightly wound — cuts through the richness of the lobster.'),

    (v_event_3, 3, 'Soup',
      'Prawn Bisque, Saffron Cream, Sourdough Crouton',
      'A deep bisque from roasted prawn shells, finished with a saffron cream and one small sourdough crouton.',
      ARRAY[]::TEXT[],
      'López de Heredia Rioja Blanco Viura', 'Rioja, Spain',
      'Oxidative and nutty — complements the bisque''s depth unexpectedly well.'),

    (v_event_3, 4, 'Fish',
      'Pan-Seared Turbot, Samphire, Lobster Butter',
      'Wild-caught turbot, seared hard on one side only. Blanched samphire, lobster roe butter, dry vermouth sauce.',
      ARRAY['GF'],
      'Domaine Leflaive Puligny-Montrachet Les Folatières', 'Burgundy, France',
      'Complex Chardonnay with white flower and brioche — elevates the lobster butter.'),

    (v_event_3, 5, 'Pre-main',
      'Scallop, Cauliflower, Curry Leaf Oil',
      'A single large diver scallop, seared until caramelised. Cauliflower three ways: roasted, puréed, pickled. Infused curry leaf oil.',
      ARRAY['GF', 'DF'],
      'Domaine Georges Vernay Condrieu Viognier', 'Northern Rhône, France',
      'Floral and stone fruit — a natural bridge between scallop and curry leaf.'),

    (v_event_3, 6, 'Main',
      'Aged Duck Breast, Cherry, Dark Chocolate Jus',
      '21-day dry-aged duck breast. Cherry gastrique, a jus of duck bones and 72% dark chocolate. Served with potato gratin.',
      ARRAY['GF'],
      'Domaine de Montille Pommard Premier Cru Rugiens', 'Burgundy, France',
      'Earthy, structured Pinot Noir — the right frame for aged duck and cherry.'),

    (v_event_3, 7, 'Dessert',
      'Yuzu Tart, Coconut Foam, Mango Sorbet',
      'Crisp tart shell, sharp yuzu curd, light coconut foam, and a quenelle of fresh mango sorbet.',
      ARRAY['V'],
      'Château d''Yquem 2018', 'Sauternes, France',
      'Honeyed and complex — a considered luxury close to the evening.');

  -- ============================================================
  -- GUESTS
  -- ============================================================
  INSERT INTO guests (id, name, email, phone) VALUES
    (v_guest_1, 'Priya Menon',     'priya.menon@demo.palette.sg',   '+65 9123 4567'),
    (v_guest_2, 'David Lim',       'david.lim@demo.palette.sg',     '+65 9234 5678'),
    (v_guest_3, 'Sarah Tan',       'sarah.tan@demo.palette.sg',     '+65 9345 6789'),
    (v_guest_4, 'Marcus Wong',     'marcus.wong@demo.palette.sg',   '+65 9456 7890'),
    (v_guest_5, 'Amelia Ng',       'amelia.ng@demo.palette.sg',     '+65 9567 8901');

  -- ============================================================
  -- BOOKINGS — Event 1 only (8 confirmed seats = 2+2+2+2)
  -- Prices: 2×$288 + wine combos = see totals below
  -- ============================================================
  INSERT INTO bookings (id, event_id, guest_id, pax, wine_pairing_count, status, total_price) VALUES
    (v_booking_1, v_event_1, v_guest_1, 2, 2, 'confirmed', 712.00),  -- 2×288 + 2×68
    (v_booking_2, v_event_1, v_guest_2, 2, 0, 'confirmed', 576.00),  -- 2×288
    (v_booking_3, v_event_1, v_guest_3, 2, 1, 'confirmed', 644.00),  -- 2×288 + 1×68
    (v_booking_4, v_event_1, v_guest_4, 2, 2, 'confirmed', 712.00);  -- 2×288 + 2×68

  -- Guest dietary details for each booking
  INSERT INTO guest_details (booking_id, guest_name, allergies, dietary_restrictions, severity, special_requests) VALUES
    (v_booking_1, 'Priya Menon',       ARRAY['shellfish'],   ARRAY['vegetarian'],  'intolerance',      'No shellfish or cross-contamination please.'),
    (v_booking_1, 'Guest of Priya',    ARRAY[]::TEXT[],      ARRAY[]::TEXT[],      'preference',       NULL),
    (v_booking_2, 'David Lim',         ARRAY[]::TEXT[],      ARRAY[]::TEXT[],      'preference',       'Celebrating our anniversary — a small note on the menu would be lovely.'),
    (v_booking_2, 'Guest of David',    ARRAY['nuts'],        ARRAY[]::TEXT[],      'life_threatening', 'Severe nut allergy. No nuts or nut oils in any course.'),
    (v_booking_3, 'Sarah Tan',         ARRAY[]::TEXT[],      ARRAY[]::TEXT[],      'preference',       NULL),
    (v_booking_3, 'Guest of Sarah',    ARRAY['dairy'],       ARRAY[]::TEXT[],      'intolerance',      'Lactose intolerant — please substitute dairy components where possible.'),
    (v_booking_4, 'Marcus Wong',       ARRAY[]::TEXT[],      ARRAY[]::TEXT[],      'preference',       NULL),
    (v_booking_4, 'Guest of Marcus',   ARRAY[]::TEXT[],      ARRAY['halal'],       'preference',       'No pork or alcohol in any dish please.');

  -- ============================================================
  -- REVIEWS (featured on homepage carousel, linked to past event)
  -- Names are prefixed [DEMO] so cleanup can target them by pattern
  -- ============================================================
  INSERT INTO reviews (guest_name, rating, quote, event_id, is_featured, is_visible) VALUES
    ('[DEMO] Priya Menon', 5,
      'One of the most memorable evenings I have spent in Singapore. Every course had a story, and the pacing was immaculate. I have already asked to be on the waitlist for the next event.',
      v_event_past, true, true),

    ('[DEMO] David Lim', 5,
      'Intimate is the right word. Sixteen guests, one table, and cooking that felt genuinely personal. The wagyu short rib was extraordinary — the best version of that dish I have ever had.',
      v_event_past, true, true),

    ('[DEMO] Sarah Tan', 5,
      'The attention to dietary needs without losing any finesse in the cooking was impressive. I rarely feel fully seen as a guest with restrictions. Here, I did.',
      v_event_past, true, true),

    ('[DEMO] Marcus Wong', 5,
      'Worth every dollar. The wine pairings were considered without being showy, and the service felt effortless in the way that only real effort produces.',
      v_event_past, true, true),

    ('[DEMO] Amelia Ng', 5,
      'I brought my mother for her birthday and she has not stopped talking about it since. The team noticed it was a special occasion without being told and made it feel exactly right.',
      v_event_past, true, true),

    ('[DEMO] James Chen', 4,
      'A genuinely unique dining format — the communal table creates conversation between strangers that you would not expect. Beautifully curated evening from start to finish.',
      v_event_past, true, true);

  -- ============================================================
  -- PAST DISHES (gallery page — 10 dishes from the past event)
  -- photo_url uses placehold.co with brand colours as a visual stand-in
  -- Replace with real Storage URLs once photos are uploaded
  -- ============================================================
  INSERT INTO past_dishes (event_id, dish_name, description, course_type, photo_url) VALUES
    (v_event_past, '[DEMO] Kombu Dashi Sphere',
      'A one-bite burst of cold ocean broth, encased in a delicate agar shell.',
      'Amuse-bouche',
      'https://placehold.co/800x600/5C2434/FAF7F2?text=Kombu+Dashi+Sphere'),

    (v_event_past, '[DEMO] Beetroot Carpaccio, Goat Curd',
      'Heritage beetroot, house-cultured goat curd, walnut praline, aged sherry vinegar.',
      'Cold Starter',
      'https://placehold.co/800x600/3D1623/FAF7F2?text=Beetroot+Carpaccio'),

    (v_event_past, '[DEMO] Roasted Celeriac Velouté',
      'Fire-roasted celeriac, Périgord truffle oil, crispy shallots.',
      'Warm Starter',
      'https://placehold.co/800x600/7B8B6F/FAF7F2?text=Celeriac+Velout%C3%A9'),

    (v_event_past, '[DEMO] Barramundi, Cauliflower Purée',
      'Wild-caught Singapore barramundi, cauliflower purée, caper beurre blanc.',
      'Fish',
      'https://placehold.co/800x600/D4A855/3D1623?text=Barramundi'),

    (v_event_past, '[DEMO] Wagyu Short Rib, Smoked Potato',
      '48-hour sous-vide wagyu short rib, smoked Russet potato, morel and red wine jus.',
      'Main',
      'https://placehold.co/800x600/5C2434/FAF7F2?text=Wagyu+Short+Rib'),

    (v_event_past, '[DEMO] Dark Chocolate Tart, Sea Salt',
      '72% Valrhona ganache, smoked sea salt flakes, espresso gel.',
      'Dessert',
      'https://placehold.co/800x600/3D1623/D4A855?text=Chocolate+Tart'),

    (v_event_past, '[DEMO] Hamachi Crudo, Yuzu Kosho',
      'Thin-sliced yellowtail, house-made yuzu kosho, cucumber water, Okinawan sea salt.',
      'Cold Starter',
      'https://placehold.co/800x600/D4A855/5C2434?text=Hamachi+Crudo'),

    (v_event_past, '[DEMO] Iberico Pork Collar, Kimchi Purée',
      'Iberico pork collar, 24-hour brine, house-fermented kimchi purée, sesame jus.',
      'Main',
      'https://placehold.co/800x600/7B8B6F/FAF7F2?text=Iberico+Pork'),

    (v_event_past, '[DEMO] Black Sesame Parfait, Yuzu Curd',
      'Frozen black sesame parfait, sharp yuzu curd, puffed rice cracker.',
      'Dessert',
      'https://placehold.co/800x600/3D1623/FAF7F2?text=Black+Sesame+Parfait'),

    (v_event_past, '[DEMO] Scallop, Cauliflower, Curry Leaf Oil',
      'Diver scallop, cauliflower three ways, infused curry leaf oil.',
      'Pre-main',
      'https://placehold.co/800x600/5C2434/D4A855?text=Scallop');

  RAISE NOTICE 'Demo seed complete for base date: %', demo_date;
  RAISE NOTICE '  Event 1 — An Ode to the Soil:  %', demo_date + 7;
  RAISE NOTICE '  Event 2 — Umami Reverie:        %', demo_date + 14;
  RAISE NOTICE '  Event 3 — Coastal Drift:        %', demo_date + 28;
  RAISE NOTICE '  Past    — The Spring Gathering: %', demo_date - 7;

END $$;
