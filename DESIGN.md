# Palette — Brand & Design System

**Extracted from the Palette Presentation Deck · April 2026**

---

## 1. Brand Identity

| Element | Value |
|---------|-------|
| Name | **Palette** |
| Location | Singapore |
| Concept | Communal tasting menu dining at rotating venues |
| Tagline | Intimate tasting menu experiences at rotating venues across Singapore |

### Brand Feeling

- **Intimate** — small-scale, personal, conversational
- **Warm** — inviting, approachable, not stuffy
- **Subtle casual luxury** — elevated without being pretentious

### Style Principles

1. Modern and clean — never cluttered or overdone
2. Not tacky — restraint over excess
3. Balance tradition with minimalism
4. Let the food and experience speak, design stays supportive

---

## 2. Color Palette

Four families, each with a full shade scale defined in `globals.css`.

### Primary — Burgundy (Deep Wine)

The signature brand color. Used for headings, primary buttons, the admin sidebar, and strong text.

| Token | Hex | Usage |
|-------|-----|-------|
| `burgundy-50` | `#FAF5F7` | Lightest tint (backgrounds) |
| `burgundy-100` | `#F0E0E6` | Light tint |
| `burgundy-200` | `#E0BFCC` | Subtle backgrounds |
| `burgundy-300` | `#C9919F` | Muted borders |
| `burgundy-400` | `#A8606F` | Secondary text, muted icons |
| `burgundy-500` | `#8B3F52` | Mid-tone accent |
| `burgundy-600` | `#6B2D3E` | Button hover, strong accent |
| `burgundy-700` | `#5C2434` | **Primary buttons, CTAs** |
| `burgundy-800` | `#4A1D2A` | Dark hover states |
| `burgundy-900` | `#3D1623` | **Headings, admin sidebar bg** |
| `burgundy-950` | `#2A0E18` | Deepest shade |

### Accent — Gold (Warm Amber)

Highlights, warning states, and decorative accents that bring warmth.

| Token | Hex | Usage |
|-------|-----|-------|
| `gold-50` | `#FDF9F0` | Lightest tint |
| `gold-100` | `#F7EDDA` | Warning badge backgrounds |
| `gold-200` | `#EEDAB5` | Light accent |
| `gold-300` | `#E0C082` | Decorative elements |
| `gold-400` | `#D4A855` | **Highlight accents, "almost full" badges** |
| `gold-500` | `#C4A265` | Mid-tone gold |
| `gold-600` | `#A8873E` | Strong accent |
| `gold-700` | `#8A6C32` | Dark gold |
| `gold-800` | `#6D5428` | Warning text on light bg |
| `gold-900` | `#5A4522` | Darkest gold |

### Success — Sage (Moss Green)

Availability indicators, success states, and natural/organic accents.

| Token | Hex | Usage |
|-------|-----|-------|
| `sage-50` | `#F5F7F3` | Lightest tint |
| `sage-100` | `#E6EBE2` | **Success badge backgrounds** |
| `sage-200` | `#CDD8C5` | Light green accent |
| `sage-300` | `#AEBFA3` | Subtle borders |
| `sage-400` | `#94A387` | Secondary green |
| `sage-500` | `#7B8B6F` | **Mid-tone, icons** |
| `sage-600` | `#627058` | Strong green |
| `sage-700` | `#4E5A47` | **Success text, "available" badges** |
| `sage-800` | `#3F483A` | Dark sage |
| `sage-900` | `#343C30` | Darkest sage |

### Neutral — Cream (Warm White)

All backgrounds, surfaces, borders, and dividers. Replaces typical gray/stone neutrals with warmth.

| Token | Hex | Usage |
|-------|-----|-------|
| `cream-50` | `#FDFCFA` | **Guest site body background** |
| `cream-100` | `#FAF7F2` | **Admin body background, footer bg** |
| `cream-200` | `#F5EFE6` | Card surfaces, hover states |
| `cream-300` | `#EDE4D5` | **Borders, dividers** |
| `cream-400` | `#DDD0BB` | **Input borders, stronger dividers** |
| `cream-500` | `#C9B99E` | Muted decorative elements |

### Semantic Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--background` | `cream-100` (`#FAF7F2`) | Default page background |
| `--foreground` | `#2D1B14` | Default body text (warm brown-black) |
| `--muted` | `cream-200` | Muted background surfaces |
| `--border` | `cream-300` | Default border color |

---

## 3. Typography

### Font Stack

| Role | Font Family | Source | CSS Variable |
|------|-------------|--------|--------------|
| Headings | **Oswald** | Google Fonts | `--font-heading` |
| Body | **Geist Sans** | next/font | `--font-sans` |
| Mono | **Geist Mono** | next/font | `--font-mono` |

### Heading Treatment

- Font: Oswald
- Weight: 600 (semibold) or 700 (bold)
- Case: **UPPERCASE**
- Letter-spacing: **wide** (`tracking-wide`)
- Applied automatically to all `<h1>`–`<h6>` via `globals.css`
- Use the `font-heading` Tailwind class for non-heading elements that need the brand typeface (e.g., nav logo, footer labels)

### Body Text

- Font: Geist Sans (clean geometric sans-serif)
- Weight: 400 (regular)
- Size: `text-sm` (14px) for most UI, `text-base` (16px) for reading content
- Color: `foreground` (#2D1B14) for primary, `burgundy-400` for muted/secondary

---

## 4. Component Patterns

### Buttons

| Variant | Background | Text | Hover |
|---------|-----------|------|-------|
| Primary | `burgundy-700` | white | `burgundy-800` |
| Secondary | `cream-200` | `burgundy-900` | `cream-300` |
| Outline | transparent + `cream-400` border | `burgundy-700` | `cream-100` bg |
| Ghost | transparent | `burgundy-700` | `cream-200` bg |
| Danger | `red-600` | white | `red-700` |

### Badges

| Variant | Background | Text | When to use |
|---------|-----------|------|-------------|
| Default | `cream-200` | `burgundy-700` | Neutral status |
| Success | `sage-100` | `sage-700` | Available, confirmed, active |
| Warning | `gold-100` | `gold-800` | Almost full, needs attention |
| Danger | `red-100` | `red-700` | Sold out, cancelled, errors |
| Info | `blue-100` | `blue-700` | Informational |

### Form Inputs

- Border: `cream-400` (default), `red-300` (error state)
- Focus ring: `burgundy-600` (2px ring)
- Labels: `burgundy-800`, `text-sm`, `font-medium`
- Error messages: `red-600`, `text-xs`

### Cards & Surfaces

- Background: `white` or `cream-50`
- Border: `cream-300`
- Border radius: `rounded-lg`
- Shadow: minimal or none (relying on borders for separation)

---

## 5. Layout Zones

### Guest Site

- Background: `cream-50`
- Header: clean nav with Palette wordmark (Oswald, uppercase, `burgundy-900`)
- Footer: `cream-100` bg with `cream-300` border-top, three-column grid
- Content: centered `max-w-6xl`, generous padding

### Admin Dashboard

- Sidebar: `burgundy-900` background, `burgundy-200` text, `burgundy-800` hover/active
- Main area: `cream-100` background
- Cards: `white` with `cream-300` border
- Stat icons: `burgundy-600` on `cream-200` background

### Login Page

- Full-screen centered form
- Background: `cream-100`
- Heading: Oswald, uppercase, `burgundy-900`
- Button: full-width `burgundy-700`

---

## 6. Visual Motifs (Future Consideration)

From the Palette presentation deck — these elements can be incorporated as the design matures:

- **Checkerboard pattern** — decorative element for backgrounds, dividers, or hover states
- **Circular image crops** — for dish photography, team portraits, and venue highlights
- **Generous whitespace** — let content breathe, avoid visual clutter
- **Warm photography** — amber/golden lighting tone in food photography when possible

---

## 7. Accessibility Notes

- Body text contrast: `#2D1B14` on `#FAF7F2` = 13.5:1 (exceeds WCAG AAA)
- Primary button: white on `#5C2434` = 10.2:1 (exceeds WCAG AAA)
- Muted text (`burgundy-400` on cream) should be used sparingly for non-essential info
- All interactive elements have visible focus rings (`burgundy-600`)
- Badge colors maintain sufficient contrast within their pairings

---

## 8. Implementation Reference

All colors are defined as CSS custom properties in `src/app/globals.css` and registered with Tailwind v4 via `@theme inline`. Use Tailwind utility classes directly:

```html
<!-- Primary button -->
<button class="bg-burgundy-700 text-white hover:bg-burgundy-800">Book Now</button>

<!-- Heading with brand font -->
<h1 class="font-heading uppercase tracking-wide text-burgundy-900">Upcoming Events</h1>

<!-- Card with brand surface -->
<div class="bg-white border border-cream-300 rounded-lg p-6">...</div>

<!-- Success badge -->
<span class="bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full text-xs">Available</span>
```

Heading font is loaded in `src/app/layout.tsx` via `next/font/google` (Oswald, weights 400–700) and applied globally to all heading elements.
