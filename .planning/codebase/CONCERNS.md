# CONCERNS.md — Technical Concerns & Debt

## Critical (Blocking Core Functionality)

### 1. Booking flow is completely missing
**File:** `src/app/(guest)/events/[slug]/page.tsx:182`
The "Reserve Your Seat" CTA links to `/book/${event.id}` but no such route exists. Any guest who tries to book gets a 404. This is the primary revenue path and it's broken.

```tsx
<Link href={`/book/${event.id}`} ...>
  Reserve Your Seat →
</Link>
```

**Impact:** Zero bookings are possible through the guest site. Admin can still manually manage bookings, but the public flow is non-functional.

---

## Security

### 2. Open redirect in auth callback
**File:** `src/app/auth/callback/route.ts:7`
The `next` query parameter is used directly in a redirect without validation:

```ts
const next = searchParams.get('next') ?? '/admin'
return NextResponse.redirect(`${origin}${next}`)
```

An attacker can craft `/auth/callback?code=...&next=//evil.com` to redirect post-login to an external site. Should validate that `next` starts with `/` and is a relative path.

### 3. Open RLS write policies on booking tables
**File:** `supabase/migrations/002_rls_policies.sql:41-55`
Bookings, guests, and guest_details allow inserts with `WITH CHECK (true)` — no validation at the RLS layer:

```sql
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT WITH CHECK (true);
```

The `create_booking` DB function (SECURITY DEFINER) validates seat availability and event status, but direct table inserts bypass it. Any anonymous user can insert arbitrary rows into `guests` or `guest_details` directly, polluting the guest list.

### 4. `create_booking` runs as SECURITY DEFINER
**File:** `supabase/migrations/003_functions.sql:92`
The function runs with superuser privileges (`SECURITY DEFINER`). This is correct for atomicity, but means any SQL injection in the JSONB parsing of `p_guest_details` would run with elevated access. The JSONB handling uses `jsonb_array_elements` which is safe, but worth noting.

### 5. No CSRF protection on server actions beyond Next.js defaults
Next.js server actions include built-in CSRF protection via `Origin` header checking, but this should be verified if any action is ever called from outside Next.js.

---

## Data Integrity

### 6. Non-atomic course update in `updateEvent`
**File:** `src/app/admin/events/actions.ts:121-136`
The delete-then-insert pattern for courses is not transactional:

```ts
// Delete existing courses
await db.from('courses').delete().eq('event_id', id)
// If insert fails here, event has NO courses
await db.from('courses').insert(coursesWithEventId)
```

If the insert fails after the delete succeeds, the event is left with zero courses. There's no rollback. Should use a DB function or Postgres transaction for this operation.

### 7. `createEvent` rollback is manual and fragile
**File:** `src/app/admin/events/actions.ts:89-93`
If course insert fails after event insert, the code manually deletes the event. This works but is fragile — if the delete also fails, an orphaned event row remains.

---

## Performance

### 8. N+1 venue fetch on homepage
**File:** `src/app/(guest)/page.tsx:44-52`
The homepage fetches the next event, then makes a separate query for the venue:

```ts
// First query: get event
const [{ data: upcomingEvents }, ...] = await Promise.all([...])
// Second query: get venue for that event (serial)
if (nextEvent?.venue_id) {
  const { data: venue } = await supabase.from('venues').select()...
}
```

This is a serial waterfall. Should use a join: `.select('*, venue:venues(*)')` like the event detail page already does.

### 9. Unbounded queries on admin guest list
**File:** `src/app/admin/guests/page.tsx` (assumed — not read)
The guests page fetches all bookings/guests with no pagination or limit. As the dataset grows this will be slow.

### 10. Event detail page revalidates every 60 seconds
**File:** `src/app/(guest)/events/[slug]/page.tsx:10`
`export const revalidate = 60` — seat counts shown to guests could be up to 60s stale. A sold-out event could appear available. Acceptable for now but worth noting.

---

## Dead Code & Unused Dependencies

### 11. `react-day-picker` installed but unused
**File:** `package.json`
The `react-day-picker` package appears in dependencies but no component uses it. Likely a planned date picker that was never implemented. Safe to remove.

### 12. Default Next.js SVG files
**File:** `public/` (likely)
Default Next.js placeholder SVGs (`file.svg`, `globe.svg`, `next.svg`, etc.) may still be present from scaffolding. Dead assets.

---

## Missing Features

### 13. No cron/reminder route implemented
**File:** `src/app/api/` — empty or absent
`CLAUDE.md` mentions a cron reminder feature. No API route for it exists. Bookings are placed but guests receive no reminder emails before the event.

### 14. Settings page is a placeholder
**File:** `src/app/admin/settings/page.tsx`
The settings page exists in the sidebar but is likely empty/placeholder.

### 15. No payment integration
The booking flow (once built) has no payment processing. `total_price` is calculated and stored in the DB but there's no Stripe or payment gateway integration. Guests can currently "book" without paying.

---

## UX / Accessibility

### 16. Sold-out state in sticky CTA is inconsistent
**File:** `src/app/(guest)/events/[slug]/page.tsx:176-188`
When sold out, the CTA renders a `<span>` styled as a button. This is not keyboard-accessible and won't be announced correctly to screen readers. Should use `<button disabled>` or an `aria-disabled` pattern.

### 17. No loading states on admin forms
Admin forms (EventForm, VenueForm) have no pending UI — the submit button doesn't disable or show a spinner during server action execution. Double-submit is possible.

### 18. No empty state handling on gallery page
**File:** `src/app/(guest)/gallery/page.tsx`
If no photos exist, the gallery page likely renders nothing. No empty state message.

---

## Architecture Observations

### 19. Admin layout double-checks auth (redundant but safe)
**File:** `src/app/admin/layout.tsx:14-18`
The admin layout fetches the user and redirects if not authenticated, duplicating what middleware already does. Not a bug — defense in depth — but adds a Supabase round-trip on every admin page load.

### 20. `requireAuth()` throws rather than redirects
**File:** `src/lib/auth.ts:6`
`requireAuth()` throws `Error('Unauthorized')` instead of calling `redirect()`. Callers don't catch this — it propagates as an unhandled exception and Next.js converts it to a 500 rather than a clean redirect. Should call `redirect('/auth/login')` instead.
