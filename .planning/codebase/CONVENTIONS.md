# Coding Conventions

**Analysis Date:** 2026-04-22

## Naming Patterns

**Files:**
- Page files: `page.tsx` (Next.js convention)
- Action files: `actions.ts` (colocated with their route segment)
- UI atoms: PascalCase matching component name — `Button.tsx`, `Input.tsx`, `Modal.tsx`
- Admin components: PascalCase — `VenueForm.tsx`, `DeleteButton.tsx`, `StatusSwitcher.tsx`
- Lib modules: camelCase — `utils.ts`, `storage.ts`, `validators.ts`, `auth.ts`

**Components:**
- PascalCase for component names and their files
- Named exports for page components (`export default function EventDetailPage`)
- Default exports for UI atoms and forms
- Display name set on `forwardRef` components: `Button.displayName = 'Button'`

**Functions:**
- camelCase — `formatDate`, `slugify`, `getSeatsStatus`, `requireAuth`
- Server actions: camelCase verb + noun — `createEvent`, `updateVenue`, `deleteReview`, `toggleFeatured`
- Event handlers within components: camelCase with `handle` prefix — `handleFileChange`, `handleRemove`

**Variables:**
- camelCase throughout
- Constants (lookup tables, enum-like arrays): SCREAMING_SNAKE_CASE — `ROMAN`, `STATUS_OPTIONS`
- Boolean flags: prefixed with `is` or `has` — `isPending`, `isSoldOut`, `isVisible`, `isFeatured`

**Types/Interfaces:**
- PascalCase interfaces: `ButtonProps`, `VenueFormProps`, `ModalProps`
- Type aliases for union variants: `ButtonVariant`, `ButtonSize`, `BadgeVariant`
- Database row types extracted with: `type Venue = Database['public']['Tables']['venues']['Row']`

## TypeScript Patterns

**Type Safety Approach:**
- Auto-generated Supabase DB types at `src/types/database.ts` — use these for all DB-sourced data
- Row types extracted at component/action file level, not re-declared globally
- `interface` for component props extending HTML element props (using `ButtonHTMLAttributes<HTMLButtonElement>`)
- `type` for union variants and simple aliases
- `as string` casting used when extracting FormData values (unavoidable, matches expected workflow)
- `safeParse()` used for Zod validation (never `parse()`) — errors are always caught and returned
- `e instanceof z.ZodError` type guard used before accessing `.issues`
- No `any` observed — unknown used where appropriate (`_prev: unknown` in `useActionState`)

**Strict patterns:**
- Function return types often inferred, not explicitly declared
- Promise return types on server actions: `Promise<{ error?: ... } | void>`
- Nullish coalescing `??` preferred over `||` for default values
- Optional chaining `?.` used liberally for nested access

## Component Patterns

**UI Atoms (`src/components/ui/`):**
- Use `forwardRef` with full HTML element type extension
- Accept `className` prop with default `''` and spread onto element
- Error state rendered inline as `<p className="mt-1 text-xs text-red-600">`
- Variant/size lookup tables typed as `Record<VariantType, string>` for className strings
- Default export, no barrel file

**Client Components (`'use client'`):**
- Required for: forms using `useActionState`, interactive controls, modals, delete confirmation
- Use `useTransition` for server action calls that don't go through `useActionState`
- State managed with `useState`/`useRef` — no external state library

**Server Components (default):**
- All `page.tsx` files in `(guest)/` and `admin/` are async server components
- Data fetching inline in the component body using Supabase client
- `notFound()` called when DB returns no rows (PGRST116 error code distinguished from real errors)
- `revalidate = 60` export used on guest pages for ISR

**Props Pattern:**
- Interfaces defined in the same file as the component
- Optional props use `?` not union with `undefined`
- Actions passed as props typed as `(formData: FormData) => Promise<{ error?: ... } | void>`

## Server Action Pattern

All admin mutations follow this exact sequence in `src/app/admin/**/actions.ts`:

```typescript
'use server'

export async function createThing(formData: FormData) {
  await requireAuth()                    // 1. Auth guard — throws if unauthenticated
  const db = createAdminClient()         // 2. Service-role client

  const raw = { /* extract from formData */ }  // 3. FormData extraction
  const parsed = schema.safeParse(raw)         // 4. Zod validation
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }  // field errors keyed by field name
  }

  const { error } = await db.from('table').insert(parsed.data)  // 5. DB mutation
  if (error) {
    return { error: { _form: [error.message] } }  // form-level error under _form key
  }

  revalidatePath('/admin/things')        // 6. Bust cache — both admin and guest paths
  revalidatePath('/things')
  redirect('/admin/things')             // 7. Redirect (or return { success: true } for modal forms)
}
```

**Error return shape:**
- Field errors: `{ error: Record<string, string[]> }` (from `flatten().fieldErrors`)
- Form-level errors: `{ error: { _form: string[] } }`
- Simple string errors (non-form actions): `{ error: string }`

**Redirect vs return:**
- Actions triggered from full-page forms: always `redirect()` on success
- Actions triggered from modals/inline forms (dishes, reviews): `return { success: true }` — no redirect

## Import Organization

**Order observed (not enforced by linter):**
1. React/Next.js imports (`react`, `next/cache`, `next/navigation`, `next/image`)
2. Internal lib imports (`@/lib/auth`, `@/lib/supabase/admin`, `@/lib/validators`, `@/lib/utils`)
3. Internal component imports (`@/components/ui/Button`, `@/components/admin/EventForm`)
4. Type imports (`@/types/database`) — imported with `type` keyword when type-only

**Path Aliases:**
- `@/` maps to `src/` — used consistently throughout, no relative `../` imports observed

**Type-only imports:**
- `import type { Database } from '@/types/database'`
- `import type { ButtonHTMLAttributes } from 'react'`

## Error Handling

**Server Actions:**
- Never throw — always return `{ error }` object
- Exception: `requireAuth()` throws `Error('Unauthorized')` — caught by Next.js error boundary
- DB errors surfaced as `error.message` strings, not re-thrown
- Zod parse errors flattened with `.flatten().fieldErrors` for per-field display

**Client Components:**
- `useActionState` used to receive and display server action error returns
- `errors?._form` rendered as a banner above the form
- `errors?.fieldName` passed to individual `Input`/`Select` `error` prop
- `try/catch` in async client handlers (e.g., `ImageUpload`) — sets local error state

**Server Components:**
- Real DB errors thrown with `throw error` — bubbles to error boundary
- PGRST116 (no rows) distinguished: `if (error && error.code !== 'PGRST116') throw error`
- Missing resource: `notFound()` — renders 404

## Form Handling

**Pattern:** Native HTML `<form>` with server actions via `useActionState`.

```typescript
const [state, formAction, isPending] = useActionState(
  async (_prev: unknown, formData: FormData) => {
    return await action(formData)
  },
  null
)
```

- `defaultValue` (not `value`) used on inputs to keep forms uncontrolled
- `isPending` from `useActionState` used to disable submit button and show loading text
- `useTransition` used for non-form server action calls (status changes, delete confirmation)
- No React Hook Form or other form library

## Styling

- Tailwind CSS v4 — utility classes only, no CSS modules
- Brand color tokens accessed as Tailwind classes: `bg-burgundy-700`, `text-gold-400`, `border-cream-400`, `text-sage-700`
- `className` composition: template literals with conditional ternary — no `clsx`/`cn` utility
- `transition-colors` used on interactive elements
- Responsive prefixes: `sm:`, `md:`, `lg:` — mobile-first

## Linting

**Configuration:** `eslint.config.mjs` — extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. No custom rules added.

**Run:** `npm run lint`

**Enforced by next/core-web-vitals:**
- React hooks rules
- `next/image` usage (no raw `<img>`)
- No unused variables (TypeScript rule)
- `key` prop on list items

No Prettier configured — formatting is not enforced.

## Comments

- Inline comments used for non-obvious decisions: `// PGRST116 = no rows returned`, `// Sort courses by sequence — Supabase doesn't guarantee order on joined tables`
- No JSDoc observed
- TODO/FIXME comments not observed in reviewed files

---

*Convention analysis: 2026-04-22*
