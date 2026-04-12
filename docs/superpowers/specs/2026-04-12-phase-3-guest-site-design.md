# Phase 3 — Guest Site Design Spec

**Date:** 2026-04-12  
**Project:** Palette  
**Phase:** 3 of 5 (Guest Site)  
**Status:** Approved

---

## Overview

Phase 3 builds the public-facing guest site. Four deliverables:

1. **Homepage** — add past dishes preview section to the existing page
2. **Events listing** — `/events`
3. **Event detail** — `/events/[slug]`
4. **Gallery** — `/gallery`

Plus: activate navigation links in `MobileHeader` once pages exist.

The homepage hero, how-it-works, and reviews sections are already built (`src/app/(guest)/page.tsx`). Phase 3 extends it and builds the remaining three pages.

---

## Design Principles (from `.impeccable.md`)

- **Restraint as luxury** — whitespace and simplicity signal quality
- **Confidence through clarity** — first-timers need enough info to trust without being overwhelmed
- **Warmth over formality** — approachable luxury, not fine-dining stiffness
- **Emotional arc** — browsing to booking should build quiet excitement, not anxiety
- **Left-aligned text, asymmetric layouts** — avoid centering everything

Brand colors: burgundy, gold, sage, cream. Headings: Oswald uppercase `tracking-wide`. Body: Geist Sans. Never use default Tailwind colors for brand accents.

---

## 1. Homepage — Past Dishes Preview

### What changes

A new section added to `src/app/(guest)/page.tsx`, inserted **after** the reviews section and before the footer.

### Data

```typescript
const { data: previewDishes } = await supabase
  .from('past_dishes')
  .select('id, dish_name, course_type, photo_url')
  .order('created_at', { ascending: false })
  .limit(3)
```

### Layout

- Section heading: "From our kitchen" (Oswald uppercase, `text-burgundy-900`)
- 3-column grid desktop, 2-column mobile (`grid-cols-2 md:grid-cols-3 gap-3`)
- Each tile: `aspect-square`, `next/image` with `object-cover`, dish name overlaid at bottom with a `burgundy-900/60` gradient
- Below the grid: "View all dishes →" link to `/gallery` (ghost button style, right-aligned)
- Section only renders if `previewDishes` has at least one entry

---

## 2. Events Listing — `/events`

**File:** `src/app/(guest)/events/page.tsx`  
**Rendering:** Server component, no revalidation (seat counts update on event detail, not here)

### Data

```typescript
const { data: events } = await supabase
  .from('events')
  .select('id, title, slug, event_date, event_time, venue_id, total_seats, booked_seats, price_per_seat, wine_pairing, status')
  .in('status', ['published', 'sold_out'])
  .gte('event_date', new Date().toISOString().split('T')[0])
  .order('event_date', { ascending: true })
```

Venue names resolved via a single query for all venue IDs present in the results (avoid N+1).

### Layout

- Page heading: "Upcoming Dinners" (Oswald uppercase)
- Subheading: short brand line, e.g. "Small groups. Rotating venues. Menus worth remembering."
- Single column of event cards, `max-w-2xl mx-auto`

### Event Card

Each card is a `<Link href={/events/${event.slug}}>` wrapping:

| Element | Treatment |
|---------|-----------|
| Date | `text-xs text-gold-400 font-medium uppercase tracking-widest` |
| Title | Oswald, `text-xl font-semibold text-burgundy-900` |
| Venue + time | `text-sm text-burgundy-400` |
| Price | `text-sm text-burgundy-900 font-medium` |
| Availability badge | See badge rules below |
| Wine chip | "Wine pairing available" — cream-200 bg, burgundy-700 text; only shown if `wine_pairing = true` |

**Availability badge rules:**

| State | Condition | Badge |
|-------|-----------|-------|
| Available | `seatsLeft > 3` | `sage-100` bg / `sage-700` text: "N seats available" |
| Almost full | `seatsLeft > 0 && seatsLeft <= 3` | `gold-100` bg / `gold-800` text: "N seats left" |
| Sold out | `seatsLeft === 0` | `cream-200` bg / `burgundy-400` text: "Sold out" — card opacity reduced |

Cards separated by `border-b border-cream-300`.

### Empty State

If no upcoming events:

```
No upcoming dinners right now.
We host intimate evenings regularly — check back soon, or browse what we've cooked before.
[View past dishes →]
```

---

## 3. Event Detail — `/events/[slug]`

**File:** `src/app/(guest)/events/[slug]/page.tsx`  
**Rendering:** Server component, `export const revalidate = 60`

### Data

```typescript
const { data: event } = await supabase
  .from('events')
  .select(`
    *,
    venue:venues(*),
    courses(* ORDER BY sequence ASC)
  `)
  .eq('slug', params.slug)
  .in('status', ['published', 'sold_out', 'completed'])
  .single()

if (!event) notFound()
```

### Layout — top to bottom

**1. Nav** (inherited from guest layout)

**2. Dark hero** (`bg-burgundy-900`)
- Eyebrow: `{weekday}, {date} · {time} · {venue.name}` — `text-xs text-gold-400 uppercase tracking-widest`
- Title: event title — Oswald, `text-4xl md:text-5xl font-bold text-white uppercase tracking-wide`
- Description: `text-sm text-burgundy-300 leading-relaxed max-w-lg`
- Chip row: "N seats total", "Wine pairing available" (if applicable), seats-remaining badge
- Padding: `py-16 px-6 max-w-3xl mx-auto`

**3. Body** (`bg-cream-50`, `max-w-3xl mx-auto px-6`)

_Venue strip_ (if venue exists):
- `bg-cream-200 rounded-lg p-4`
- Location pin icon + venue name (`font-semibold text-burgundy-900`) + address (`text-sm text-burgundy-400`) + venue description (`text-sm text-burgundy-500 mt-2`)

_Menu section:_
- Section heading: "The Menu" — Oswald uppercase
- Each course row: roman numeral (`text-burgundy-300 italic`) · course type heading · dish title + description · dietary tags · wine note (if event has wine_pairing and course has wine_name)
- Courses separated by `border-b border-cream-300`
- Dietary tags rendered as small `cream-200/burgundy-700` badges

**4. Sticky bottom CTA bar** (`bg-burgundy-700`, `sticky bottom-0`)
- Left: price `text-white font-bold text-lg` + `/person text-burgundy-300 text-sm`
- Sub-line: wine pairing upsell if `event.wine_pairing && event.wine_price` (`+ S${formatCurrency(event.wine_price)} optional wine pairing`)
- Right: "Reserve Your Seat →" — white button with `burgundy-900` text, links to `/book/[event.id]`
- Sold-out state: button replaced with disabled "Sold Out" in muted styling; cancellation note hidden

---

## 4. Gallery — `/gallery`

**File:** `src/app/(guest)/gallery/page.tsx`  
**Rendering:** Server component fetches all dishes; passes to client component for filter interaction

### Data

```typescript
const { data: dishes } = await supabase
  .from('past_dishes')
  .select('id, dish_name, description, course_type, photo_url, event_id, event:events(title, slug)')
  .order('created_at', { ascending: false })
```

Distinct `course_type` values derived from the results (no extra query).

### Component split

```
gallery/page.tsx          — server component, fetches data
  └── GalleryGrid.tsx     — 'use client', manages filter state
```

`GalleryGrid` receives `dishes: PastDish[]` as props. Filter state via `useState<string>('all')`.

### Layout

- Page heading: "Past Dishes" (Oswald uppercase) + `"{N} dishes across {M} dinners"` subtitle
- Filter chips row: "All" + one chip per distinct `course_type`. Active chip: `burgundy-900` bg white text. Inactive: `cream-200` bg `burgundy-700` text
- Grid: `grid grid-cols-2 md:grid-cols-3 gap-1` (tight gap creates editorial tile feel)
- Each tile:
  - `aspect-square relative overflow-hidden`
  - `next/image` with `object-cover fill`
  - Bottom overlay gradient `from-burgundy-900/0 to-burgundy-900/70`
  - Dish name: `text-white text-xs font-semibold` at bottom-left
  - Event attribution: `text-burgundy-300 text-xs` below dish name (if `event` join is non-null — show `event.title`, otherwise omit)
- No lightbox or individual dish page in Phase 3

### Empty filter state

If a filter chip returns no dishes: "No {course_type} dishes yet." centered in the grid area.

---

## 5. Navigation Updates

**File:** `src/components/guest/MobileHeader.tsx`

Once all Phase 3 pages are built, populate `navLinks`:

```typescript
const navLinks = [
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
]
```

`About` link not added until Phase 5.

---

## 6. New Files

| File | Type | Notes |
|------|------|-------|
| `src/app/(guest)/events/page.tsx` | Server component | Events listing |
| `src/app/(guest)/events/[slug]/page.tsx` | Server component | Event detail |
| `src/app/(guest)/gallery/page.tsx` | Server component | Fetches dishes, renders GalleryGrid |
| `src/components/guest/GalleryGrid.tsx` | Client component | Filter + grid rendering |

Modified files:
- `src/app/(guest)/page.tsx` — add past dishes preview section
- `src/components/guest/MobileHeader.tsx` — activate nav links

---

## 7. Data Fetching Notes

- All guest pages use `src/lib/supabase/server.ts` (anon key + RLS). No admin client.
- Event detail uses `revalidate = 60` — seat counts stay reasonably fresh without real-time overhead.
- Gallery uses default static caching (dishes change rarely).
- Events listing uses no revalidation — sold-out status only matters on the detail page where guests actually book.
- Venue N+1 avoided on events listing by collecting all `venue_id`s and doing a single `IN` query.

---

## 8. Out of Scope for Phase 3

- About page (`/about`) — Phase 5
- Booking flow — Phase 4
- Dish lightbox / individual dish pages
- Event filtering (by month, venue) — not needed at current event volume
- OG images / SEO meta — Phase 5
