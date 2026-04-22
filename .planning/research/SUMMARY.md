# Research Summary: Palette — Booking Flow & Launch Polish

**Synthesized:** 2026-04-22
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall Confidence:** HIGH

---

## Executive Summary

Palette's database schema, DB functions (`create_booking`, `cancel_booking`), admin scaffolding, and Zod validators are already in place. The work is wiring the guest-facing booking flow, email notifications, admin cancel action, and launch polish (mobile, SEO, testing). No new framework-level dependencies are needed except `@react-email/components` and a testing stack (Vitest + Playwright).

Build the booking form first (it blocks everything else), wire email as a fire-and-forget side effect immediately after, then close admin gaps (cancel action, guest CRM), then ship polish phases independently.

---

## Stack

Stack is locked. One install needed: `@react-email/components`. Three env vars needed: `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`.

Do NOT install: `next-seo` (Pages Router only), `react-email` full package (dev server bloat), SWR/React Query (contradicts server component architecture), React Hook Form (multi-step wizard with `useReducer` is simpler).

Core additions:
- `@react-email/components` — email template primitives
- `resend ^6.10.0` — already installed; wire via `src/lib/email.ts`
- `next/metadata` + `next/og` — built into Next.js; zero-dependency
- Vitest `^3.x` + `@testing-library/react` — unit tests
- Playwright `^1.x` — E2E for booking happy path

## Table Stakes Features

**Launch-blocking:**
- Multi-step booking form at `/book/[eventId]`
- Booking confirmation page with cancellation policy
- Guest confirmation email + admin new-booking alert
- Admin cancel booking action
- Mobile-responsive booking form and event detail

**Launch quality:**
- Event reminder cron at `/api/cron/reminders`
- `generateMetadata()` SEO on event pages
- Admin bookings allergy severity badges
- Guest CRM click-through to booking history

**Defer post-launch:**
- Guest self-service cancellation
- Post-event follow-up email
- Dynamic OG images
- Allergy print sheet

**Do not build:**
- Guest accounts, waitlist, Stripe, SMS, multi-admin roles, booking modification

## Watch Out For

1. **Open RLS INSERT policies** — `WITH CHECK (true)` on bookings/guests/guest_details allows direct anonymous insertion bypassing the RPC. Fix with migration before launch.
2. **Double-submit on booking** — Two concurrent requests may both succeed. Fix: disable button via `useTransition` pending state + `UNIQUE` constraint or idempotency token.
3. **Email after `redirect()` never executes** — `redirect()` throws internally; code after it is dead. Fire-and-forget email BEFORE redirect.
4. **`requireAuth()` throws 500** — Expired admin sessions yield 500 instead of login redirect. One-line fix needed before new admin actions.
5. **Form state lost on refresh** — Persist non-PII fields to `sessionStorage` on each dispatch; use URL params for step navigation.
6. **`booking_deadline` timezone mismatch** — `datetime-local` has no timezone; Vercel runs UTC; SGT is +08:00. Without explicit conversion, deadline will be 8 hours wrong.
7. **iOS Safari keyboard** — Pushes viewport up and breaks fixed/sticky "Next Step" CTA. Must test on real iOS.

## Suggested Phase Structure

| # | Phase | Rationale |
|---|-------|-----------|
| 1 | Security & Foundation | Fix RLS policies + `requireAuth()` before any guest-facing code ships |
| 2 | Booking Flow Core | Product is blocked without this; longest phase, highest UX risk |
| 3 | Email Notifications | Unblocked after Phase 2; guest confirmation is a launch blocker |
| 4 | Admin Completion & Cron | Cancel action, guest CRM, cron handler; depends on Phases 2+3 |
| 5 | Polish (Mobile, SEO, Testing) | Independent; mobile-responsive pass, metadata, test suite |

## Research Flags

- **Resend v6 API:** MEDIUM confidence on exact method signatures — verify at resend.com/docs
- **React Email templates:** `emails/` directory may be empty — verify before Phase 3
- **Vitest/Playwright versions:** Confirm current stable majors on npm before installing

---

*Synthesized: 2026-04-22 from 4 research files*
