# Domain Pitfalls

**Domain:** Private dining booking platform — booking flow, email notifications, mobile responsive
**Project:** Palette (Next.js 15 + Supabase)
**Researched:** 2026-04-22
**Confidence:** HIGH — derived primarily from codebase analysis (schema, RLS, server action patterns, CONCERNS.md)

---

## Critical Pitfalls

Mistakes that cause double-bookings, lost data, broken user flows, or security regressions.

---

### Pitfall 1: Double-Booking via Double-Submit on the Final Step

**What goes wrong:** The guest taps "Confirm Booking" on a slow mobile connection. The server action takes 2-3s. They tap again. Two concurrent requests hit `create_booking`. The DB function uses `SELECT ... FOR UPDATE` on the event row, so the second call blocks, but if `pax` from both calls together exceeds remaining seats, the first succeeds and the second raises an exception — which is correct. However, if the client does not disable the submit button before the first response returns, a second request may succeed if there are still enough seats (e.g., a party of 2 with 4 seats remaining yields two confirmed bookings for the same guest email).

**Why it happens:** The existing convention (`isPending` from `useActionState`) disables the submit button, but multi-step forms managed with `useReducer` require explicit pending state threading. The submit lives in a client component's final step; if that step mounts fresh, its local `isPending` resets.

**Consequences:** Duplicate booking rows for the same guest+event pair; guest receives two confirmation emails; admin sees inflated numbers; seat count is correct (DB deducted both), so sold-out state triggers correctly — but the CRM is polluted.

**Prevention:**
- Add a `UNIQUE` constraint on `(event_id, guest_id)` in the bookings table, or handle it in `create_booking` with a duplicate-check guard.
- Alternatively, generate a client-side idempotency token in step 1 and store it on the booking row; duplicate requests with the same token return the existing booking ID.
- Always disable the confirm button via `useTransition` or `useActionState` `isPending` and never re-enable it after a successful submission.

**Warning signs:** QA testing on a throttled connection (Chrome DevTools Network → Slow 4G) produces two booking confirmation emails.

**Phase:** Booking flow implementation — build this guard before wiring the submit action.

---

### Pitfall 2: Multi-Step Form State Lost on Browser Back / Refresh

**What goes wrong:** Guest completes step 1 (pax + wine), step 2 (per-guest allergies), step 3 (contact). They navigate away or the browser refreshes. All state held in `useReducer` is gone — they restart from step 1.

**Why it happens:** React state is ephemeral. The 4-step form is client-only; nothing persists to URL or session.

**Consequences:** High booking abandonment. In an intimate venue context (8-20 seats, premium price), every abandoned booking is significant.

**Prevention:**
- Encode current step + non-sensitive data (pax, wine count, dietary answers) in `sessionStorage` on each reducer dispatch. Rehydrate on mount.
- Do NOT store email/phone in sessionStorage (minor PII concern on shared devices).
- Use URL search params (`?step=2`) for step tracking so browser back works naturally — this requires pushing state to the URL on each step transition.

**Warning signs:** Testers report "I had to start over" during QA.

**Phase:** Booking flow — address in initial architecture of the form, not as a patch later.

---

### Pitfall 3: RLS Bypass Allows Direct Table Insertion, Polluting Guest CRM

**What goes wrong:** The `guests`, `bookings`, and `guest_details` tables have `WITH CHECK (true)` INSERT policies (see `002_rls_policies.sql:41-55`, flagged in CONCERNS.md §3). Any anonymous caller can insert arbitrary rows directly — they don't have to go through the `create_booking` RPC. A bot scanning for Supabase endpoints (the project URL is visible in client-side code) can flood the guest list with fake records.

**Why it happens:** The intent was "booking goes through the DB function (SECURITY DEFINER) which validates everything." That's true for legitimate callers, but the RLS policies don't enforce it.

**Consequences:** Fake guests in the CRM, inflated seat counts if bots insert into `bookings` directly, chef receives incorrect dietary data.

**Prevention:**
- Remove the broad `WITH CHECK (true)` policies on `bookings`, `guests`, and `guest_details`.
- Route all guest-side bookings exclusively through the `create_booking` RPC (already the plan). Grant `EXECUTE` on the function to `anon` role, revoke direct `INSERT` on the three tables.
- Example: `REVOKE INSERT ON bookings FROM anon; GRANT EXECUTE ON FUNCTION create_booking TO anon;`

**Warning signs:** Guest list in the admin CRM contains names/emails that don't match any booking confirmation sent through Resend.

**Phase:** Booking flow — fix the migration before wiring the guest-facing submit action. A new migration (`005_tighten_rls.sql`) is appropriate.

---

### Pitfall 4: Email Sent Before Booking Confirmed, or Not Sent at All After Redirect

**What goes wrong:** Two failure modes:
1. Email fires before `create_booking` returns; if the RPC raises an exception (seats gone, deadline passed), the guest receives a confirmation for a booking that doesn't exist.
2. Email fires after `redirect()` — but `redirect()` in Next.js throws internally (uses a thrown `NEXT_REDIRECT` error). Any `await` after `redirect()` never executes.

**Why it happens:** Server actions using the established pattern always end with `redirect()`. Developers add `await sendEmail(...)` before the redirect but after the DB call — this is the right place, but easy to put after by accident. Mode 1 is caused by sending before confirming the RPC succeeded.

**Consequences:** Mode 1: Ghost confirmation emails for failed bookings. Mode 2: Booking succeeds silently with no guest-facing confirmation — chef gets no alert, guest has no reference number.

**Prevention:**
- Sequence: `const bookingId = await supabase.rpc('create_booking', ...); if (error) return { error }; await sendConfirmationEmail(bookingId); redirect('/book/[eventId]/confirmation')`.
- Keep email sending fire-and-forget wrapped in a try/catch that logs but does not block the redirect: if email fails, the booking is still valid. Use `void sendEmail(...).catch(console.error)` followed immediately by `redirect()` — this is the correct pattern for "fire and forget before redirect."
- Never put `await sendEmail()` after `redirect()`.

**Warning signs:** Integration tests show booking record created in DB but no email delivered to test inbox.

**Phase:** Email notifications implementation — define the sequencing rule before writing the action.

---

### Pitfall 5: `cancel_booking` Is Callable by Anyone Who Knows a Booking UUID

**What goes wrong:** The `cancel_booking` function exists and enforces the 48-hour window correctly. But if it's exposed through a guest-facing server action (e.g., for a cancellation link), any caller who knows a booking UUID can cancel any booking — including bookings that aren't theirs.

**Why it happens:** There's no guest authentication. The function takes `p_booking_id` and `p_is_admin`. If `p_is_admin = false`, it enforces the 48h window but does not verify the caller owns the booking. Booking UUIDs are v4 (hard to guess), but the confirmation email will include the UUID in a cancellation link, making it discoverable.

**Consequences:** Targeted cancellation attacks if someone intercepts or forwards a confirmation email; accidental self-cancellation if a guest forwards an email with the cancellation link.

**Prevention:**
- Add a separate `cancellation_token` column to `bookings` (a random token, stored hashed) — embed this token in the cancellation link, not the booking UUID.
- Or: require email verification — cancellation link emails a one-time code to the guest's email, which must be entered to confirm.
- At minimum, verify the guest's email matches the booking's guest email before calling `cancel_booking` in the server action.

**Warning signs:** Cancellation link in confirmation email contains only the UUID and no secondary token.

**Phase:** Booking cancellation implementation.

---

## Moderate Pitfalls

---

### Pitfall 6: Seat Availability Shown as Stale (60s ISR) Leading to False "Available" State

**What goes wrong:** Event detail page uses `export const revalidate = 60`. A guest sees 2 seats available, starts the 4-step booking form, completes it in 90s, and submits — by then someone else booked the last 2 seats. The `create_booking` RPC correctly raises "Not enough seats available," but the guest only learns this at step 4 after completing all dietary info.

**Why it happens:** ISR keeps seat count stale by design (avoids websocket complexity, per PROJECT.md). The tradeoff is acceptable at low traffic but creates UX friction at the moment of final submission.

**Consequences:** User frustration — they completed the full form only to be told it's sold out at the last step.

**Prevention:**
- Do a live seat-availability check (via RPC or direct query) at the start of step 1, not just relying on what the event detail page showed. This is a fast, read-only query.
- On the confirmation page (before step 1 renders), fetch current `booked_seats` / `total_seats` via a server component with `cache: 'no-store'` and redirect to a sold-out page if no seats remain.
- Show the real-time available count in step 1's pax selector (max = live available).

**Warning signs:** Testers can reproduce "sold out at final step" by booking the last seats in one browser while another browser has step 1 open.

**Phase:** Booking flow — build availability check into the route entry point.

---

### Pitfall 7: Dynamic Per-Guest Allergy Rows Not Synced to `pax` Changes

**What goes wrong:** Guest selects 4 pax in step 1. In step 2, they see 4 allergy rows. They go back and change to 2 pax. The reducer may not trim the `guestDetails` array — it might keep 4 rows. `bookingSchema` has a `.refine` that checks `guestDetails.length === pax`, so the server action will reject it with a validation error. But the UX shows "Confirm" without visible error until server round-trip.

**Why it happens:** `useReducer` state for step 1 (pax) and step 2 (guestDetails array) are independent sub-trees. Back-navigation that changes pax must also trim/extend the guestDetails array.

**Consequences:** Confusing server-side validation error at the final step that mentions "Must provide details for each guest" — not obviously actionable from the user's perspective.

**Prevention:**
- In the reducer's `SET_PAX` action, immediately resize the `guestDetails` array: trim if new pax < current length, pad with empty structs if new pax > current length.
- Add a client-side pre-submission validation on step 3 (contact) or step 4 (review) that re-checks `guestDetails.length === pax` before allowing progression.

**Warning signs:** Manual QA: set pax = 4, fill step 2, go back, set pax = 2, proceed to confirm — form submits but returns a validation error.

**Phase:** Booking flow — reducer design.

---

### Pitfall 8: `requireAuth()` Throws Instead of Redirects, Causing 500 on Booking Admin Actions

**What goes wrong:** `requireAuth()` in `src/lib/auth.ts` throws `Error('Unauthorized')` instead of calling `redirect('/auth/login')` (flagged in CONCERNS.md §20). Admin booking actions (cancel booking, mark no-show) that call `requireAuth()` will produce a 500 error page rather than redirecting to login when the session expires mid-session.

**Why it happens:** Already identified technical debt in the codebase. The existing admin actions all call `requireAuth()` but sessions are relatively long-lived so it hasn't surfaced.

**Consequences:** Admin sees a 500 error, loses the context of what they were doing, has to navigate back to login manually.

**Prevention:**
- Fix `requireAuth()` to call `redirect('/auth/login')` before writing any new booking admin actions. This is a one-line fix in `src/lib/auth.ts`.

**Warning signs:** Session expires while admin is on the bookings dashboard; clicking any action button produces a 500.

**Phase:** Booking admin dashboard — fix this before wiring admin booking actions.

---

### Pitfall 9: Resend Fire-and-Forget Swallows Delivery Failures Silently

**What goes wrong:** Confirmation emails fail silently. Resend API key is wrong, domain is not verified, or the email address is on a suppression list. The booking succeeds and `redirect()` fires, but no email was sent. Admin has no visibility.

**Why it happens:** Fire-and-forget pattern (`void sendEmail().catch(console.error)`) is correct for not blocking the user, but `console.error` in a Vercel/serverless environment is only visible in function logs — not surfaced to the admin dashboard.

**Consequences:** Guest has no confirmation. Chef has no alert. Admin has no idea unless they check deployment logs.

**Prevention:**
- Log email delivery failures to the `bookings` table: add an `email_sent_at` timestamp column (nullable). Set it after successful Resend response. Admin bookings dashboard can flag rows where `email_sent_at IS NULL` after a certain age.
- Alternatively, use Resend webhooks to update a delivery status field.
- At minimum, test the Resend integration in a staging environment with a real domain before launch.

**Warning signs:** Booking confirmed in admin dashboard but guest reports no email received; `email_sent_at` column is always NULL.

**Phase:** Email notifications + admin bookings dashboard — implement together.

---

### Pitfall 10: Mobile Sticky CTA Covers Form Content on Short Viewports

**What goes wrong:** A sticky "Next Step" button fixed to the bottom of the viewport overlaps the last visible form field on mobile, especially on devices with a software keyboard open. Guest cannot see or interact with the bottom input because the sticky bar covers it.

**Why it happens:** CSS `position: fixed; bottom: 0` + iOS Safari's browser chrome that shrinks on scroll but the keyboard adds ~260px of obscuring content. Tailwind's `pb-safe` (padding-bottom for safe-area-inset) doesn't account for keyboard height.

**Consequences:** Inputs are unreachable; guests on iPhones (the dominant device for Singapore diners) cannot complete the booking. Silent abandonment.

**Prevention:**
- Do not use a fixed/sticky CTA for the multi-step form. Scroll the button into view naturally, or place it below the last field with enough padding.
- If a sticky CTA is desired, use the Visual Viewport API to detect keyboard open state and adjust the CTA's `bottom` offset dynamically.
- Test on real iOS Safari at each step, not just Chrome DevTools device emulation (which does not replicate iOS keyboard behavior accurately).

**Warning signs:** Any form field that appears last in the step is unreachable on iPhone SE (375×667 viewport) with keyboard open.

**Phase:** Mobile responsive pass — specifically test the booking form flow, not just marketing pages.

---

### Pitfall 11: OG Image Generation Blocks ISR and Hits Timeouts

**What goes wrong:** Next.js `ImageResponse` for OG images (e.g., per-event OG) runs in an Edge runtime. If the OG image fetches data from Supabase (event title, venue name) and Supabase cold-start latency is high, the Edge function times out (10s limit on Vercel free tier).

**Why it happens:** Dynamic OG images are tempting for per-event pages but require data fetching at the Edge, which has stricter timeout and memory limits than Node.js serverless.

**Consequences:** Social share previews on LINE/WhatsApp (dominant in Singapore) show blank or broken images — significantly impacting event promotion.

**Prevention:**
- Generate OG images at build time for events, or make them static templates with text overlaid using CSS (no canvas/font loading).
- If dynamic, cache aggressively: `export const runtime = 'edge'; export const revalidate = 3600`.
- Test OG image routes under load before launch using `curl -I` to check response time.

**Warning signs:** `og:image` URL returns a timeout or 500 when shared; Vercel function logs show "Function execution timed out."

**Phase:** SEO + OG images.

---

## Minor Pitfalls

---

### Pitfall 12: Cron Reminder Fires for Cancelled Events

**What goes wrong:** The 24h-before-event reminder cron job queries for events happening within 24 hours and sends emails to all confirmed bookings. If an admin cancelled an event after the reminder was queued or if the cron runs against `status = 'published'` without excluding `status = 'cancelled'`, guests get reminded about a cancelled event.

**Prevention:**
- Cron query filter: `status IN ('published', 'sold_out')` — explicitly exclude `'cancelled'` and `'completed'`.
- Add a `cancelled_at` column or check `status = 'cancelled'` on bookings before sending.

**Phase:** Cron job implementation.

---

### Pitfall 13: `booking_deadline` Timezone Mismatch

**What goes wrong:** `booking_deadline` is stored as `TIMESTAMPTZ` (correct). But the admin form collects it as a local datetime string (e.g., `<input type="datetime-local">`) which the browser submits without timezone offset. The server action parses it naively, treating it as UTC — meaning a deadline set to "2026-05-01 23:59" in SGT (+08:00) is actually stored as 2026-05-01 23:59 UTC, which is 07:59 SGT the next morning, 8 hours too late.

**Why it happens:** `datetime-local` inputs produce ISO strings without timezone info (`2026-05-01T23:59`). JavaScript's `new Date('2026-05-01T23:59')` interprets this as local time on the server, but Vercel's server runs in UTC.

**Consequences:** Guests can book after the intended deadline; or the deadline appears 8 hours earlier than intended if someone interprets UTC as SGT.

**Prevention:**
- Append `+08:00` to the datetime-local value before sending to the server action, or store timezone as a separate field.
- Alternatively: treat all deadlines as SGT — convert to UTC explicitly in the server action: `new Date(rawDeadline + '+08:00').toISOString()`.

**Warning signs:** Admin sets a booking deadline for end-of-day SGT; guests can still book at 8 AM the next morning SGT.

**Phase:** Booking form + event management — fix in the existing `updateEvent` action before the booking flow goes live.

---

### Pitfall 14: Per-Guest Name Defaults to Organizer Name in Step 2

**What goes wrong:** Step 2 renders one row per guest for allergy info. The `guest_name` field in each row defaults to blank. Guests don't fill in individual names — they leave them blank or type "Guest 1". The chef receives allergy data tied to anonymous labels, defeating the purpose.

**Prevention:**
- Pre-fill guest_name[0] with the organizer's name from step 3 (contact step) — but step 3 comes after step 2. Instead, ask for the organizer's name in step 1 alongside pax, and pre-fill the first guest row.
- Show clear labeling: "Guest 1 (you)", "Guest 2", etc. with a placeholder.

**Phase:** Booking flow — form UX design.

---

### Pitfall 15: Confirmation Page Accessible Without Completing Booking

**What goes wrong:** The confirmation page at `/book/[eventId]/confirmation` is a static route. If a guest navigates to it directly (e.g., bookmarked URL, browser back from confirmation), they see a confirmation UI without a real booking.

**Prevention:**
- Pass the booking ID as a query param and verify it exists in the DB on the confirmation page server component. If not found, redirect to the event page.
- Or: use a short-lived session token stored in a cookie set only after successful `create_booking` response.

**Phase:** Booking flow — confirmation route design.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Booking form reducer design | Pitfall 7 — pax change doesn't sync guestDetails array | Resize array in SET_PAX reducer action |
| Final form submission | Pitfall 1 — double-submit | Idempotency token or unique DB constraint on (event_id, guest_id) |
| Form state management | Pitfall 2 — state lost on refresh | sessionStorage rehydration + URL step param |
| RLS before going live | Pitfall 3 — open INSERT policies | New migration to revoke direct INSERT, grant EXECUTE on RPC |
| Email wiring | Pitfall 4 — email after redirect / before success | Explicit sequence: RPC → email (try/catch) → redirect |
| Cancellation link | Pitfall 5 — UUID-only link is phishable | Add cancellation_token column, embed token not UUID in link |
| Availability UX | Pitfall 6 — 60s stale seat count | Live fetch at booking route entry point |
| Auth debt | Pitfall 8 — requireAuth throws 500 | Fix before writing admin booking actions |
| Email observability | Pitfall 9 — silent delivery failures | email_sent_at column, flag in admin dashboard |
| Mobile form | Pitfall 10 — sticky CTA covers keyboard | No fixed CTA, or Visual Viewport API |
| SEO / OG images | Pitfall 11 — Edge timeout | Static/cached OG, test response time |
| Cron job | Pitfall 12 — reminders for cancelled events | Filter by status IN ('published', 'sold_out') |
| Event management | Pitfall 13 — timezone mismatch on deadline | Append +08:00 to datetime-local value |
| Booking UX | Pitfall 14 — anonymous guest names | Pre-fill first guest from organizer name in step 1 |
| Confirmation route | Pitfall 15 — confirmation page without booking | Verify booking ID on server component, redirect if missing |

---

## Sources

- Codebase analysis: `supabase/migrations/002_rls_policies.sql`, `003_functions.sql`, `004_cancel_booking_and_fixes.sql`
- Codebase analysis: `.planning/codebase/CONCERNS.md` (pre-existing issues §3, §20)
- Codebase analysis: `src/lib/validators.ts` (bookingSchema refinements)
- Codebase analysis: `.planning/codebase/CONVENTIONS.md` (server action pattern, form handling)
- Codebase analysis: `.planning/PROJECT.md` (ISR decision, fire-and-forget email decision)
- Domain knowledge: iOS Safari Visual Viewport API behavior (keyboard obscuring fixed elements)
- Domain knowledge: Next.js `redirect()` internals (throws `NEXT_REDIRECT`, aborts execution)
- Domain knowledge: Vercel Edge runtime constraints (10s timeout, memory limits)
