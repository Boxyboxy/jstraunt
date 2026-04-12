# Phase 3 — Guest Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the four Phase 3 guest-facing pages: homepage past-dishes preview, events listing, event detail, and past-dishes gallery.

**Architecture:** All pages are Next.js server components using the anon Supabase client (`src/lib/supabase/server.ts`). The gallery grid is the only client component (needed for filter state). The event detail page uses `revalidate = 60`. No API routes are added — all reads are direct Supabase queries in server components.

**Tech Stack:** Next.js 15 App Router, Supabase JS client, Tailwind CSS v4, `next/image`, `date-fns`, `lucide-react`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/app/(guest)/page.tsx` | Add past dishes preview section |
| Create | `src/app/(guest)/events/page.tsx` | Events listing — server component |
| Create | `src/app/(guest)/events/[slug]/page.tsx` | Event detail — server component |
| Create | `src/app/(guest)/gallery/page.tsx` | Gallery — fetches data, renders GalleryGrid |
| Create | `src/components/guest/GalleryGrid.tsx` | Client component — filter chips + dish grid |
| Modify | `src/components/guest/MobileHeader.tsx` | Activate nav links |

---

## Task 1: Homepage — Past Dishes Preview

**Files:**
- Modify: `src/app/(guest)/page.tsx`

The homepage already fetches events and reviews. Add a third parallel query for 3 recent past dishes, then render a preview section after reviews.

- [ ] **Step 1: Add the past dishes query**

Open `src/app/(guest)/page.tsx`. Replace the existing `Promise.all` at the top of `HomePage` with a three-way parallel fetch:

```typescript
// Replace the existing Promise.all (lines ~14-30) with:
const [{ data: upcomingEvents }, { data: reviews }, { data: previewDishes }] = await Promise.all([
  supabase
    .from('events')
    .select()
    .eq('status', 'published' as Event['status'])
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .limit(1)
    .returns<Event[]>(),
  supabase
    .from('reviews')
    .select()
    .eq('is_featured', true)
    .eq('is_visible', true)
    .limit(3)
    .returns<Review[]>(),
  supabase
    .from('past_dishes')
    .select('id, dish_name, photo_url')
    .order('created_at', { ascending: false })
    .limit(3),
])
```

- [ ] **Step 2: Add the past dishes preview section**

Add the import for `Image` at the top of the file:

```typescript
import Image from 'next/image'
```

Then add this section at the end of the returned JSX, just before the closing `</div>`:

```tsx
{/* Past Dishes Preview */}
{previewDishes && previewDishes.length > 0 && (
  <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
    <div className="flex items-baseline justify-between mb-10 sm:mb-12">
      <h2 className="text-lg sm:text-xl font-heading font-semibold uppercase tracking-wide text-burgundy-900">
        From our kitchen
      </h2>
      <Link
        href="/gallery"
        className="text-sm text-burgundy-500 hover:text-burgundy-800 transition-colors"
      >
        View all dishes →
      </Link>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {previewDishes.map((dish) => (
        <Link
          key={dish.id}
          href="/gallery"
          className="group relative aspect-square overflow-hidden rounded-lg block"
        >
          <Image
            src={dish.photo_url}
            alt={dish.dish_name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/70 via-transparent to-transparent" />
          <p className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs font-semibold leading-tight">
            {dish.dish_name}
          </p>
        </Link>
      ))}
    </div>
  </section>
)}
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Open [http://localhost:3000](http://localhost:3000). If the database has past dishes, the "From our kitchen" section should appear between the reviews and footer. If no dishes exist, the section is hidden — that's correct.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(guest\)/page.tsx
git commit -m "feat: add past dishes preview section to homepage"
```

---

## Task 2: Events Listing Page

**Files:**
- Create: `src/app/(guest)/events/page.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/app/\(guest\)/events
```

Create `src/app/(guest)/events/page.tsx`:

```typescript
import Link from 'next/link'
import { MapPin, Clock, Wine } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatTime, getSeatsStatus } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import Badge from '@/components/ui/Badge'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

export default async function EventsPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data: events } = await supabase
    .from('events')
    .select('id, title, slug, event_date, event_time, venue_id, total_seats, booked_seats, price_per_seat, wine_pairing, status')
    .in('status', ['published', 'sold_out'] as Event['status'][])
    .gte('event_date', today)
    .order('event_date', { ascending: true })

  // Fetch venue names in one query — avoid N+1
  const venueIds = [...new Set((events ?? []).map(e => e.venue_id).filter(Boolean))] as string[]
  const { data: venues } = venueIds.length > 0
    ? await supabase.from('venues').select('id, name').in('id', venueIds)
    : { data: [] }

  const venueMap = Object.fromEntries((venues ?? []).map(v => [v.id, v.name]))

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="font-heading font-semibold uppercase tracking-wide text-burgundy-900 text-2xl sm:text-3xl mb-3">
          Upcoming Dinners
        </h1>
        <p className="text-sm text-burgundy-400 mb-10">
          Small groups. Rotating venues. Menus worth remembering.
        </p>

        {(!events || events.length === 0) && (
          <div className="py-16 text-center">
            <p className="text-burgundy-800 font-medium mb-2">No upcoming dinners right now.</p>
            <p className="text-sm text-burgundy-400 mb-6">
              We host intimate evenings regularly — check back soon, or browse what we&rsquo;ve cooked before.
            </p>
            <Link
              href="/gallery"
              className="text-sm text-burgundy-700 hover:text-burgundy-900 underline underline-offset-4"
            >
              View past dishes →
            </Link>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="divide-y divide-cream-300">
            {events.map((event) => {
              const seatsLeft = event.total_seats - event.booked_seats
              const seatStatus = getSeatsStatus(event.booked_seats, event.total_seats)
              const isSoldOut = seatStatus === 'sold_out'

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className={`block py-7 group transition-opacity ${isSoldOut ? 'opacity-60' : ''}`}
                >
                  <p className="text-xs text-gold-400 font-medium uppercase tracking-widest mb-2">
                    {format(parseISO(event.event_date), 'EEE, d MMM yyyy')}
                    {' · '}
                    {formatTime(event.event_time)}
                  </p>
                  <h2 className="font-heading font-semibold uppercase tracking-wide text-burgundy-900 text-xl group-hover:text-burgundy-700 transition-colors mb-1">
                    {event.title}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-burgundy-400 mb-3">
                    {venueMap[event.venue_id ?? ''] && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {venueMap[event.venue_id!]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-burgundy-900">
                      {formatCurrency(event.price_per_seat)}/person
                    </span>
                    {seatStatus === 'available' && (
                      <Badge variant="success">{seatsLeft} seats available</Badge>
                    )}
                    {seatStatus === 'almost_full' && (
                      <Badge variant="warning">{seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left</Badge>
                    )}
                    {seatStatus === 'sold_out' && (
                      <Badge variant="default">Sold out</Badge>
                    )}
                    {event.wine_pairing && (
                      <span className="inline-flex items-center gap-1 text-xs bg-cream-200 text-burgundy-700 px-2 py-0.5 rounded-full">
                        <Wine className="h-3 w-3" />
                        Wine pairing available
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Open [http://localhost:3000/events](http://localhost:3000/events). You should see the events list. If the DB is empty, the empty state message renders instead. Check that sold-out events appear at reduced opacity.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(guest\)/events/page.tsx
git commit -m "feat: add events listing page"
```

---

## Task 3: Event Detail Page

**Files:**
- Create: `src/app/(guest)/events/[slug]/page.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/app/\(guest\)/events/\[slug\]
```

Create `src/app/(guest)/events/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatTime, getSeatsStatus } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import Badge from '@/components/ui/Badge'
import type { Database } from '@/types/database'

export const revalidate = 60

type Course = Database['public']['Tables']['courses']['Row']

// Roman numerals for up to 10 courses
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select(`
      *,
      venue:venues(*),
      courses(*)
    `)
    .eq('slug', slug)
    .in('status', ['published', 'sold_out', 'completed'])
    .single()

  if (!event) notFound()

  // Sort courses by sequence — Supabase doesn't guarantee order on joined tables
  const courses: Course[] = [...(event.courses ?? [])].sort(
    (a, b) => a.sequence - b.sequence
  )
  const venue = event.venue as Database['public']['Tables']['venues']['Row'] | null

  const seatsLeft = event.total_seats - event.booked_seats
  const seatStatus = getSeatsStatus(event.booked_seats, event.total_seats)
  const isSoldOut = seatStatus === 'sold_out'

  return (
    <div className="bg-cream-50">
      {/* ── Dark hero ── */}
      <div className="bg-burgundy-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <p className="text-xs text-gold-400 font-medium uppercase tracking-widest mb-4">
            {format(parseISO(event.event_date), 'EEEE, d MMMM yyyy')}
            {' · '}
            {formatTime(event.event_time)}
            {venue && ` · ${venue.name}`}
          </p>
          <h1 className="font-heading font-bold uppercase tracking-wide text-white text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-sm text-burgundy-300 leading-relaxed mb-6 max-w-lg">
              {event.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-white/10 text-burgundy-200 rounded px-2.5 py-1">
              {event.total_seats} seats total
            </span>
            {event.wine_pairing && (
              <span className="text-xs bg-white/10 text-burgundy-200 rounded px-2.5 py-1">
                Wine pairing available
              </span>
            )}
            {seatStatus === 'available' && (
              <Badge variant="success">{seatsLeft} seats remaining</Badge>
            )}
            {seatStatus === 'almost_full' && (
              <Badge variant="warning">{seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left</Badge>
            )}
            {seatStatus === 'sold_out' && (
              <Badge variant="default">Sold out</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28">

        {/* Venue strip */}
        {venue && (
          <div className="bg-cream-200 rounded-lg p-4 mb-10 flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-cream-300 rounded flex items-center justify-center">
              <MapPin className="h-4 w-4 text-burgundy-500" />
            </div>
            <div>
              <p className="text-xs text-burgundy-400 font-medium uppercase tracking-widest mb-0.5">Venue</p>
              <p className="text-sm font-semibold text-burgundy-900">{venue.name}</p>
              <p className="text-xs text-burgundy-400">{venue.address}</p>
              {venue.description && (
                <p className="text-xs text-burgundy-500 mt-2 leading-relaxed">{venue.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Menu */}
        {courses.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold uppercase tracking-wide text-burgundy-900 text-lg mb-6">
              The Menu
            </h2>
            <div className="divide-y divide-cream-300">
              {courses.map((course, index) => (
                <div key={course.id} className="py-5 flex gap-4">
                  <span className="text-burgundy-300 italic text-sm min-w-[1.5rem] flex-shrink-0 mt-0.5">
                    {ROMAN[index] ?? index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-burgundy-400 uppercase tracking-wide mb-0.5">
                      {course.course_type}
                    </p>
                    <p className="text-sm font-semibold text-burgundy-900 mb-1">
                      {course.dish_title}
                    </p>
                    {course.description && (
                      <p className="text-sm text-burgundy-500 leading-relaxed mb-2">
                        {course.description}
                      </p>
                    )}
                    {course.dietary_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {course.dietary_tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-cream-200 text-burgundy-700 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {event.wine_pairing && course.wine_name && (
                      <p className="text-xs text-burgundy-400 italic">
                        ♦ {course.wine_name}
                        {course.wine_region && `, ${course.wine_region}`}
                        {course.wine_note && ` — ${course.wine_note}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-burgundy-700 border-t border-burgundy-600 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-lg leading-tight">
              {formatCurrency(event.price_per_seat)}
              <span className="text-burgundy-300 text-sm font-normal ml-1">/person</span>
            </p>
            {event.wine_pairing && event.wine_price && !isSoldOut && (
              <p className="text-burgundy-300 text-xs mt-0.5">
                + {formatCurrency(event.wine_price)} optional wine pairing
              </p>
            )}
          </div>
          {isSoldOut ? (
            <span className="bg-cream-200 text-burgundy-400 rounded-md px-5 py-2.5 text-sm font-medium cursor-not-allowed">
              Sold Out
            </span>
          ) : (
            <Link
              href={`/book/${event.id}`}
              className="bg-white text-burgundy-900 rounded-md px-5 py-2.5 text-sm font-semibold hover:bg-cream-100 transition-colors whitespace-nowrap"
            >
              Reserve Your Seat →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Open [http://localhost:3000/events](http://localhost:3000/events), click an event card. You should land on the detail page. Check:
- Dark hero renders with gold eyebrow, white heading
- Venue strip appears if venue is set
- Courses list with roman numerals
- Fixed bottom bar with price and CTA button

Note: "Reserve Your Seat →" links to `/book/[event.id]` which does not exist until Phase 4. Clicking it will 404 — this is expected.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(guest\)/events/\[slug\]/page.tsx
git commit -m "feat: add event detail page with dark hero and sticky CTA"
```

---

## Task 4: Gallery Grid Client Component

**Files:**
- Create: `src/components/guest/GalleryGrid.tsx`

This is a `'use client'` component. It receives all dishes from the server page and handles filter state.

- [ ] **Step 1: Create the component**

Create `src/components/guest/GalleryGrid.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Dish = {
  id: string
  dish_name: string
  course_type: string | null
  photo_url: string
  event: { title: string; slug: string } | null
}

type Props = {
  dishes: Dish[]
  courseTypes: string[]
}

export default function GalleryGrid({ dishes, courseTypes }: Props) {
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const filtered = activeFilter === 'all'
    ? dishes
    : dishes.filter(d => d.course_type === activeFilter)

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveFilter('all')}
          className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-burgundy-900 text-white'
              : 'bg-cream-200 text-burgundy-700 hover:bg-cream-300'
          }`}
        >
          All
        </button>
        {courseTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
              activeFilter === type
                ? 'bg-burgundy-900 text-white'
                : 'bg-cream-200 text-burgundy-700 hover:bg-cream-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-burgundy-400 text-sm py-16">
          No {activeFilter} dishes yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {filtered.map((dish) => (
            <div key={dish.id} className="relative aspect-square overflow-hidden group">
              <Image
                src={dish.photo_url}
                alt={dish.dish_name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-xs font-semibold leading-tight">
                  {dish.dish_name}
                </p>
                {dish.event && (
                  <Link
                    href={`/events/${dish.event.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-burgundy-300 text-xs hover:text-white transition-colors"
                  >
                    {dish.event.title}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: No verify step needed yet** — this component is not used until Task 5.

---

## Task 5: Gallery Page

**Files:**
- Create: `src/app/(guest)/gallery/page.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/app/\(guest\)/gallery
```

Create `src/app/(guest)/gallery/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import GalleryGrid from '@/components/guest/GalleryGrid'

export default async function GalleryPage() {
  const supabase = await createClient()

  const { data: dishes } = await supabase
    .from('past_dishes')
    .select('id, dish_name, course_type, photo_url, event:events(title, slug)')
    .order('created_at', { ascending: false })

  const allDishes = dishes ?? []

  // Distinct course types in the order they first appear
  const courseTypes = [...new Set(
    allDishes.map(d => d.course_type).filter((t): t is string => t !== null)
  )]

  // Count unique events for the subtitle
  const eventCount = new Set(
    allDishes.map(d => (d.event as { title: string; slug: string } | null)?.title).filter(Boolean)
  ).size

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-10 sm:mb-12">
          <h1 className="font-heading font-semibold uppercase tracking-wide text-burgundy-900 text-2xl sm:text-3xl mb-2">
            Past Dishes
          </h1>
          {allDishes.length > 0 && (
            <p className="text-sm text-burgundy-400">
              {allDishes.length} dish{allDishes.length === 1 ? '' : 'es'} across {eventCount} dinner{eventCount === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {allDishes.length === 0 ? (
          <p className="text-center text-burgundy-400 text-sm py-16">
            No dishes yet — check back after our first dinner.
          </p>
        ) : (
          <GalleryGrid
            dishes={allDishes.map(d => ({
              id: d.id,
              dish_name: d.dish_name,
              course_type: d.course_type,
              photo_url: d.photo_url,
              event: d.event as { title: string; slug: string } | null,
            }))}
            courseTypes={courseTypes}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Open [http://localhost:3000/gallery](http://localhost:3000/gallery). Check:
- Page heading with dish count renders
- Filter chips show for each course type in the data
- Grid is 2-col on mobile, 3-col on desktop
- Hovering a tile slides up the dish name overlay
- Clicking "All" resets the filter
- Empty filter state shows "No X dishes yet."

- [ ] **Step 3: Commit**

```bash
git add src/app/\(guest\)/gallery/page.tsx src/components/guest/GalleryGrid.tsx
git commit -m "feat: add past dishes gallery with course-type filter"
```

---

## Task 6: Activate Navigation Links

**Files:**
- Modify: `src/components/guest/MobileHeader.tsx`

- [ ] **Step 1: Populate navLinks**

Open `src/components/guest/MobileHeader.tsx`. Replace the empty `navLinks` array (line 8):

```typescript
// Replace:
const navLinks: { href: string; label: string }[] = []

// With:
const navLinks: { href: string; label: string }[] = [
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
]
```

- [ ] **Step 2: Verify**

Open [http://localhost:3000](http://localhost:3000). On desktop, "Events" and "Gallery" links appear in the header. On mobile (<640px), a hamburger icon appears — tapping it drops down the nav links.

- [ ] **Step 3: Commit**

```bash
git add src/components/guest/MobileHeader.tsx
git commit -m "feat: activate nav links for events and gallery pages"
```

---

## Task 7: End-to-End Check

No new files — this is a manual verification pass across all four pages.

- [ ] **Step 1: Full flow walkthrough**

With `npm run dev` running, walk through:

1. **Homepage** → past dishes preview appears below reviews → "View all dishes →" link goes to `/gallery`
2. **Events page** (`/events`) → event cards render → sold-out events at reduced opacity → clicking a card navigates to the event detail
3. **Event detail** (`/events/[slug]`) → dark hero with gold eyebrow, white heading → venue strip → numbered menu courses → sticky bottom CTA bar visible when scrolled
4. **Gallery** (`/gallery`) → dish grid renders → filter chips work → hovering dishes shows name overlay → event attribution links go to the correct event detail

- [ ] **Step 2: Mobile check**

Resize browser to 375px width (iPhone 12 size). Check:
- Homepage preview grid is 2 columns
- Events cards are readable
- Event detail hero text doesn't overflow; sticky CTA bar fits
- Gallery grid is 2 columns; filter chips wrap correctly
- Nav hamburger appears; menu drops down correctly

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Fix any errors before the final commit.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: phase 3 guest site complete — events, event detail, gallery, nav"
```
