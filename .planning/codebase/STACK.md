# Technology Stack

**Analysis Date:** 2026-04-22

## Languages

**Primary:**
- TypeScript 5.x — all source files in `src/`
- SQL — Supabase migrations in `supabase/migrations/`

**Secondary:**
- CSS — global styles and brand tokens in `src/app/globals.css`

## Runtime

**Environment:**
- Node.js (version not pinned; `@types/node ^20` implies Node 20+)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.2 — full-stack React framework; App Router with Server Components
- React 19.2.4 — UI rendering
- React DOM 19.2.4 — DOM bindings

**Build/Dev:**
- TypeScript compiler via Next.js build pipeline
- PostCSS via `@tailwindcss/postcss ^4` — configured in `postcss.config.mjs`
- ESLint 9 — configured in `eslint.config.mjs` with `eslint-config-next` (core-web-vitals + typescript presets)

## Styling

**Framework:** Tailwind CSS v4 (`tailwindcss ^4`)

**Integration:** PostCSS plugin (`@tailwindcss/postcss`). No separate `tailwind.config.*` file — Tailwind v4 uses CSS-based config.

**Brand tokens:** CSS custom properties defined in `src/app/globals.css` under `:root` and `@theme inline`:
- `--color-burgundy-*` (50–950) — primary actions, admin sidebar
- `--color-gold-*` (50–900) — highlights
- `--color-sage-*` (50–900) — success, availability
- `--color-cream-*` (50–500) — backgrounds, cards

**Semantic tokens:**
- `--background` → `--color-cream-100`
- `--foreground` → `#2d1b14`
- `--muted` → `--color-cream-200`
- `--border` → `--color-cream-300`

**Fonts:** Loaded from Google Fonts via `next/font/google` in `src/app/layout.tsx`:
- Geist Sans (`--font-geist-sans`) — body text (`--font-sans`)
- Geist Mono (`--font-geist-mono`) — monospace (`--font-mono`)
- Oswald (`--font-oswald`, weights 400/500/600/700) — headings (`--font-heading`)

**No component library** — custom UI atoms live in `src/components/ui/`.

## Key Dependencies

**Critical:**
- `@supabase/supabase-js ^2.101.1` — Supabase JS client (DB, auth, storage)
- `@supabase/ssr ^0.10.0` — Supabase SSR helpers for Next.js (session cookies, middleware)
- `zod ^4.3.6` — runtime validation for forms and server actions (`src/lib/validators.ts`)
- `resend ^6.10.0` — transactional email (imported in package.json; not yet wired in src)
- `date-fns ^4.1.0` — date formatting utilities (`src/lib/utils.ts`)
- `lucide-react ^1.7.0` — icon library
- `react-day-picker ^9.14.0` — date picker component for booking flow

**Infrastructure:**
- `supabase ^2.84.10` (devDependency) — Supabase CLI for local dev, migrations, type generation

## Configuration

**Environment:**
- Configured via environment variables (see INTEGRATIONS.md for required vars)
- Next.js public vars prefixed `NEXT_PUBLIC_`

**Build:**
- `next.config.ts` — enables remote image patterns for `*.supabase.co` Storage URLs
- `postcss.config.mjs` — registers `@tailwindcss/postcss` plugin
- `tsconfig.json` — TypeScript project config
- Path alias `@/` maps to `src/`

## Platform Requirements

**Development:**
- Node 20+
- Supabase CLI for local database (`supabase start`, `supabase db push`)
- `npm run dev` — runs Next.js dev server on localhost:3000

**Production:**
- Deployed to Vercel (inferred from `vercel.json` presence)
- Vercel cron jobs configured in `vercel.json`

---

*Stack analysis: 2026-04-22*
