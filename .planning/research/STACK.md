# Technology Stack

**Project:** Palette — Booking Flow & Launch Polish
**Researched:** 2026-04-22
**Milestone scope:** Adding booking flow, transactional email, mobile polish, SEO, and testing to an existing Next.js 16 + Supabase app.

---

## Constraint: Stack Is Already Established

The core stack is locked. This document covers only what needs to be *added* for this milestone. Do not introduce new framework-level dependencies. Do not replace anything in the existing stack.

**Locked (do not change):**
- Next.js 16.2.2 (App Router)
- React 19.2.4
- Supabase JS `^2.101.1` + SSR `^0.10.0`
- Tailwind CSS v4
- Zod `^4.3.6`
- TypeScript 5.x
- Vercel deployment

---

## What This Milestone Adds

The codebase already has `resend ^6.10.0` installed and `react-day-picker ^9.14.0` installed. The task is wiring them in and adding testing tooling. No new dependencies are needed for the booking form, email, SEO, or mobile work — only for testing.

---

## Recommended Additions

### Transactional Email — Already Installed, Not Yet Wired

| Technology | Installed Version | Status | Purpose |
|------------|------------------|--------|---------|
| `resend` | `^6.10.0` | Installed, not wired | Email delivery API |
| `@react-email/components` | Not installed | **Needs install** | Composable email template primitives |

**Rationale for Resend:** Already chosen and installed. It has a first-class Next.js integration: call `resend.emails.send()` from a server action or route handler. Fire-and-forget pattern (do not `await` inside the booking server action response path — use `void` or a background-safe wrapper so email failure never blocks the booking confirmation redirect).

**Rationale for React Email:** The `emails/` directory is already referenced in PROJECT.md ("React Email templates exist in `emails/`"), and the templates (BookingConfirmation, BookingCancellation, EventReminder, PostEventFollowUp) already exist conceptually. `@react-email/components` provides the `Html`, `Body`, `Container`, `Text`, `Button`, `Hr`, `Preview` primitives needed to render those templates. Without it the templates cannot be compiled.

**Install:**
```bash
npm install @react-email/components
```

**Do NOT install:** `react-email` (the full dev preview package) — it pulls in a local dev server that is not needed in production. Install only `@react-email/components`.

**Confidence:** HIGH — this is the canonical Resend + Next.js pattern. Resend's own documentation uses exactly this split.

---

### Multi-Step Booking Form — No New Dependencies

| Technology | Approach | Why |
|------------|----------|-----|
| `useReducer` | Built-in React | PROJECT.md explicitly specifies this pattern |
| `react-day-picker` | Already installed (`^9.14.0`) | Date/time picker if needed — already present |
| Zod `bookingSchema` | Already in `src/lib/validators.ts` | Schema already written, covers all booking fields |

**Rationale:** The booking form state (pax, wine, guest details per person, contact, confirm) maps cleanly to a reducer with step transitions. This is the project's own decision (logged in KEY DECISIONS in PROJECT.md). Do not reach for a form library (React Hook Form, Formik) — the codebase uses `useActionState` with native forms, and the multi-step form lives entirely on the client between steps, only submitting on the final step via a server action.

**Pattern:** `useReducer` manages step index and accumulated form state. The final step submits to a server action that calls `supabase.rpc('create_booking', ...)`. The `create_booking` DB function already exists and handles atomicity.

**Confidence:** HIGH — pattern is native React, matches existing codebase conventions, and is specified in PROJECT.md.

---

### Seat Availability / Optimistic UI — No New Dependencies

| Approach | Why |
|----------|-----|
| ISR with `revalidate = 60` | Already established pattern for event pages |
| `useOptimistic` (React 19 built-in) | Show "booking in progress" state without a library |

**Rationale:** PROJECT.md specifies "ISR (60s revalidation) for seat counts" as a decided approach. The event detail page already uses `export const revalidate = 60`. For the booking form itself, after a successful RPC call `revalidatePath('/events/[slug]')` will update the seat count on next load. No websockets, no Redis, no SWR needed.

**Do NOT add:** SWR, React Query, or any data-fetching library. The existing pattern of server component data fetching + `revalidatePath` covers the use case.

**Confidence:** HIGH — this is the stated decision and matches App Router ISR semantics.

---

### SEO Meta Tags and OG Images — No New Dependencies

| Technology | Approach | Why |
|------------|----------|-----|
| `next/metadata` API | Built into Next.js App Router | Generates `<head>` meta tags from exported `metadata` objects |
| `next/og` (ImageResponse) | Built into Next.js | Generates OG images on-the-fly via Edge runtime |

**Rationale:** Next.js App Router has a first-class `generateMetadata()` export for per-page dynamic metadata and a built-in `ImageResponse` from `next/og` for generating Open Graph images at a route like `/api/og`. No `next-seo` or any third-party SEO library is needed — that package was designed for the Pages Router and is redundant in App Router.

**OG image approach for Palette:** Use `next/og` to generate branded OG images (event title, date, venue name) at `/api/og?eventId=...` or similar. The edge runtime constraint means OG image routes cannot use Node-only APIs.

**Do NOT add:** `next-seo` — it is a Pages Router library. In App Router it adds no value and conflicts with the built-in metadata system.

**Confidence:** HIGH — this is the official Next.js App Router pattern, documented in the framework itself.

---

### Testing — Needs New Dependencies

This is the only area requiring net-new tooling.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `vitest` | `^3.x` | Unit test runner | Zero-config with TypeScript, compatible with Next.js, fast |
| `@vitejs/plugin-react` | `^4.x` | Vitest React support | Needed for JSX transform in test files |
| `@testing-library/react` | `^16.x` | Component/hook testing | Test React components without a browser |
| `@testing-library/user-event` | `^14.x` | Simulate user interactions | Pairs with testing-library/react |
| `playwright` | `^1.x` | E2E browser testing | Test the booking happy path end-to-end |
| `@playwright/test` | `^1.x` | Playwright test runner | Included with Playwright |

**Rationale for Vitest over Jest:** Vitest is faster (native ESM, no transform overhead), zero-config with TypeScript, and the codebase's own TESTING.md already recommends it. Next.js 15+ has a Jest integration that requires heavier configuration (`jest.config.js`, `jest-environment-jsdom`, `@testing-library/jest-dom`). Vitest requires none of that setup.

**Rationale for Playwright over Cypress:** Playwright has better support for Next.js server components and server actions because it tests against the real running server. It handles navigation, form submission across multiple steps, and network interception. Cypress struggles with App Router's streaming and server actions. The TESTING.md recommendation aligns: "E2E with Playwright for the booking flow."

**Scope of testing this milestone:**
1. Unit tests: `src/lib/utils.ts` (pure functions), `src/lib/validators.ts` (Zod schemas with cross-field refinements — these are the highest-risk validators per TESTING.md)
2. Integration: `create_booking` RPC (against local Supabase)
3. E2E: booking happy path (event detail → book → confirm → email sent)

**Install (dev dependencies):**
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event
npm install -D @playwright/test
npx playwright install chromium
```

**Confidence:** MEDIUM — Vitest and Playwright versions verified against training data (August 2025 cutoff). Vitest 3.x and Playwright 1.x are the stable current majors. Exact minor versions should be confirmed against npm before installing.

---

### Mobile Responsiveness — No New Dependencies

All mobile responsive work is Tailwind CSS utility changes. The existing Tailwind v4 setup with `sm:`, `md:`, `lg:` responsive prefixes is sufficient. No new UI library, no new CSS framework needed.

**Specific areas requiring mobile work (from ARCHITECTURE.md + CONCERNS.md):**
- Guest pages: events calendar, event detail (CTA sticky footer for mobile), gallery grid
- Admin pages: sidebar needs a mobile drawer pattern (MobileHeader component already exists in architecture)
- Booking form: step indicators and multi-column guest detail forms need single-column reflow

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Email library | `@react-email/components` | MJML, Handlebars templates | React Email matches existing codebase (TSX), already referenced in PROJECT.md |
| Form state | `useReducer` (built-in) | React Hook Form | RHF is for complex validation on single forms; multi-step wizard with `useReducer` is simpler and matches existing `useActionState` pattern |
| SEO | `next/metadata` (built-in) | `next-seo` | `next-seo` is Pages Router only; `next/metadata` is the correct App Router API |
| Unit tests | Vitest | Jest | Jest requires heavier config with Next.js; Vitest is zero-config; TESTING.md recommends Vitest |
| E2E tests | Playwright | Cypress | Playwright handles App Router server actions and streaming better; Cypress has known limitations with Next.js 15 RSC |
| Data fetching (seat counts) | ISR + `revalidatePath` | SWR / React Query | Already established pattern; adding a client-side data-fetching library contradicts the server component architecture |
| OG images | `next/og` (built-in) | Cloudinary auto-generate, Vercel OG | `next/og` requires no external service, generates on-demand, works at Edge runtime |

---

## Environment Variables Needed

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `RESEND_API_KEY` | Authenticate Resend email sending | Server actions and cron handler |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for OG image generation and email links | `next/og` route, email templates |
| `CRON_SECRET` | Authenticate Vercel cron job calls to `/api/cron/reminders` | Cron route handler |

The Vercel cron route (`/api/cron/reminders`) is already configured in `vercel.json` but the handler does not exist. It should verify `Authorization: Bearer <CRON_SECRET>` before sending any emails.

---

## What Does Not Need to Change

| Area | Current State | Assessment |
|------|--------------|------------|
| `@supabase/supabase-js` | `^2.101.1` | Sufficient — `rpc('create_booking')` and `rpc('cancel_booking')` are already typed |
| `zod` | `^4.3.6` | Sufficient — `bookingSchema` already written and covers all booking fields |
| `date-fns` | `^4.1.0` | Sufficient — all formatting utilities exist in `src/lib/utils.ts` |
| `lucide-react` | `^1.7.0` | Sufficient — icon coverage adequate |
| `react-day-picker` | `^9.14.0` | Already installed; wire in if a date picker is needed in booking flow |
| Tailwind CSS v4 | Current | All design tokens defined; mobile work is classes only |
| TypeScript config | Current | No changes needed |
| ESLint config | Current | No changes needed |

---

## Sources

- Codebase analysis: `/Users/box/code/jstraunt/.planning/codebase/STACK.md`, `INTEGRATIONS.md`, `TESTING.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`
- Project context: `/Users/box/code/jstraunt/.planning/PROJECT.md`
- Package inventory: `/Users/box/code/jstraunt/package.json`
- Validator review: `/Users/box/code/jstraunt/src/lib/validators.ts`
- Resend + Next.js integration: training data (August 2025 cutoff) — MEDIUM confidence on exact API shape, verify against resend.com/docs before wiring
- Vitest / Playwright recommendations: training data (August 2025 cutoff) + TESTING.md codebase recommendation — MEDIUM confidence on exact versions
- `next/metadata` + `next/og` APIs: built into Next.js, HIGH confidence these exist in Next.js 16
