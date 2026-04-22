# STRUCTURE.md — Directory Structure & File Organization

## Top-Level Layout

```
jstraunt/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # Reusable React components
│   ├── lib/                    # Utilities, clients, helpers
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # SQL migration files (ordered)
├── public/                     # Static assets
├── middleware.ts               # Edge middleware (session refresh + auth guard)
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind v4 config (minimal — uses CSS vars)
└── package.json
```

---

## `src/app/` — Route Tree

```
src/app/
├── layout.tsx                  # Root layout (font loading, metadata)
├── globals.css                 # CSS variables (brand palette, fonts)
├── favicon.ico
│
├── (guest)/                    # Route group — public SSR pages
│   ├── layout.tsx              # Guest layout (nav + footer)
│   ├── page.tsx                # Homepage — events teaser, reviews, gallery preview
│   ├── events/
│   │   ├── page.tsx            # All upcoming events list
│   │   └── [slug]/
│   │       └── page.tsx        # Event detail + menu + CTA (links to /book/[id])
│   └── gallery/
│       └── page.tsx            # Photo gallery of past dishes
│
├── admin/                      # Admin dashboard — auth-guarded
│   ├── layout.tsx              # Admin layout (sidebar + auth check)
│   ├── page.tsx                # Dashboard overview
│   ├── events/
│   │   ├── page.tsx            # Events list
│   │   ├── actions.ts          # createEvent, updateEvent, updateEventStatus, deleteEvent
│   │   ├── new/page.tsx        # Create event form
│   │   └── [id]/
│   │       ├── page.tsx        # Edit event form
│   │       └── bookings/
│   │           └── page.tsx    # Bookings for this event
│   ├── venues/
│   │   ├── page.tsx
│   │   ├── actions.ts          # createVenue, updateVenue, deleteVenue
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── guests/
│   │   └── page.tsx            # Guest list (read-only)
│   ├── dishes/
│   │   ├── page.tsx
│   │   ├── actions.ts          # createDish, deleteDish
│   │   └── DishesManager.tsx   # Client component for dish CRUD
│   ├── reviews/
│   │   ├── page.tsx
│   │   ├── actions.ts
│   │   ├── ReviewFormWrapper.tsx
│   └── settings/
│       └── page.tsx            # Placeholder settings page
│
├── auth/
│   ├── login/page.tsx          # Email/password login form
│   └── callback/route.ts       # OAuth code exchange → session → redirect
│
└── api/
    └── (empty or minimal)      # API routes — booking submission, cron reminders
```

**Note:** `/book/[id]` route is referenced by the event detail page CTA (`href={/book/${event.id}}`) but **does not exist**. This is the most critical missing feature.

---

## `src/components/` — Component Library

```
src/components/
├── admin/                      # Admin-only components (all Client Components)
│   ├── Sidebar.tsx             # Navigation sidebar with active link highlighting
│   ├── EventForm.tsx           # Full event create/edit form
│   ├── MenuBuilder.tsx         # Dynamic course CRUD (add/remove/reorder)
│   ├── VenueForm.tsx           # Venue create/edit + image upload
│   ├── ReviewForm.tsx          # Review create/edit
│   ├── ReviewActions.tsx       # Approve/hide/delete review actions
│   ├── DeleteButton.tsx        # Confirm-before-delete button
│   └── StatusSwitcher.tsx      # Event status dropdown
│
├── guest/                      # Guest-facing Client Components
│   ├── GalleryGrid.tsx         # Masonry gallery with client-side filter
│   └── MobileHeader.tsx        # Mobile nav with hamburger state
│
└── ui/                         # Primitive UI atoms
    ├── Badge.tsx               # Status badge (success/warning/default variants)
    ├── Button.tsx              # Button with variants
    ├── Input.tsx               # Form input with label/error
    ├── Select.tsx              # Form select
    ├── Modal.tsx               # Modal dialog
    └── ImageUpload.tsx         # Supabase Storage upload widget
```

---

## `src/lib/` — Core Utilities

```
src/lib/
├── auth.ts                     # requireAuth() — server action auth guard
├── storage.ts                  # Supabase Storage upload/delete helpers
├── utils.ts                    # Pure helpers: formatDate, formatCurrency, slugify, getSeatsStatus
├── validators.ts               # Zod schemas: bookingSchema, eventSchema, venueSchema, reviewSchema
└── supabase/
    ├── server.ts               # createClient() — server-side, anon key + RLS
    ├── admin.ts                # createAdminClient() — service-role, bypasses RLS
    ├── client.ts               # createBrowserClient() — browser-side
    └── middleware.ts           # updateSession() — edge session refresh + /admin guard
```

---

## `supabase/migrations/` — Database Migrations

```
001_initial_schema.sql          # Tables: venues, events, courses, guests, bookings, guest_details, reviews, past_dishes
002_rls_policies.sql            # RLS policies (public read for published data, open write for booking tables)
003_functions.sql               # create_booking() — atomic booking function with row lock
004_cancel_booking_and_fixes.sql # Booking cancellation + schema fixes
```

---

## File Naming Conventions

| Pattern | Convention |
|---------|-----------|
| Pages | `page.tsx` (Next.js convention) |
| Layouts | `layout.tsx` |
| Server actions | `actions.ts` colocated with route |
| Route handlers | `route.ts` |
| Components | `PascalCase.tsx` |
| Utilities | `camelCase.ts` |
| Types | `camelCase.ts` or `database.ts` (auto-generated) |

---

## Where to Put New Code

| Need | Location |
|------|---------|
| New public page | `src/app/(guest)/[route]/page.tsx` |
| New admin page | `src/app/admin/[feature]/page.tsx` |
| New admin mutations | `src/app/admin/[feature]/actions.ts` |
| Shared form component | `src/components/admin/` |
| New UI primitive | `src/components/ui/` |
| New utility function | `src/lib/utils.ts` |
| New Zod schema | `src/lib/validators.ts` |
| DB schema change | New `supabase/migrations/00N_description.sql` |
| API endpoint | `src/app/api/[route]/route.ts` |
