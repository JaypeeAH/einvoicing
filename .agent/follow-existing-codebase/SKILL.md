---
name: follow-existing-codebase
description: >-
  Follow the SME e-Invoicing Next.js codebase's architecture, coding style, component patterns,
  conventions, RBAC model, BIR compliance rules and design system when implementing new features, pages,
  UI elements, API routes, database changes or modifications. Activate this skill for any development task
  that adds or modifies code in the repository. It ensures consistency, maximum reuse, and that new code
  looks like a natural extension of the existing codebase.
---

# Follow Existing Codebase

> **Core Principle:** Before creating anything new, search for something that already exists. Reuse it if
> possible. If it cannot be reused directly, extend or compose it. Only create something new when there is
> a clear reason.

This is a multi-tenant electronic invoicing app for Philippine SMEs (BIR: RR 7-2024, RMC 5-2021,
RR 8-2022, RR 26-2025, RMC 98-2026). Correctness of invoices, serial numbers, the audit trail and
permissions matters more than anything else.

For the detailed architecture reference, read [architecture.md](./references/architecture.md).

---

## Decision Hierarchy

1. **Reuse** an existing component, hook, utility, service or store
2. **Extend** an existing one in a backward-compatible way
3. **Compose** existing pieces into a new feature component
4. **Create** a new reusable component (in `components/shared` or the feature folder)
5. **Create** page-specific implementation (last resort)

Never jump directly to step 5.

---

## Before Writing Any Code

### Step 1 — Understand the request
Identify what is needed: page, component, API route, database change, BIR rule, fix.

### Step 2 — Search the codebase
1. `src/components/ui/` — UI primitives (never modify unless fixing a bug; never delete — unused ones are kept on purpose)
2. `src/components/shared/` — PageHeader, DataTable, ConfirmDialog, EmptyState, StatusBadge, StatCard, DebounceInput, Forbidden, AuthorityCheck, Loading, Container, NavToggle
3. `src/components/<feature>/` — existing feature components, `*SWRProvider`s, selects (CustomerSelect, ProductSelect, ReferenceInvoiceSelect)
4. `src/services/` — client API functions + SWR hooks
5. `src/stores/` — Zustand stores (`createCollectionStore`, `createResourceStore`)
6. `src/@types/` — entity types, `forms/` zod schemas, `*Meta` lightweight types, status badge options
7. `src/utils/` and `src/utils/hooks/` — invoice calculation, BIR validation, formatting, hooks
8. `src/constants/` — roles, actions, permissions, **bir.constant.ts** (all BIR rules/labels with citations)
9. `src/configs/` — app paths, navigation, icons, theme, Supabase public config
10. `src/server/` — data access, API wrappers, auth guards, EIS providers
11. `supabase/migrations/` — schema, RLS, database functions

### Step 3 — Produce a short plan

| Section | Content |
|---|---|
| **Existing components to reuse** | Every existing component that applies |
| **Existing hooks/utils/services/stores** | Anything that can be reused |
| **New files required** | Only those that genuinely need to be created |
| **Database / RLS impact** | New tables, policies, functions (new migration file — never edit an applied one) |
| **Permissions** | Which `ACTION_*` guards the page, API route and RLS policy |
| **BIR impact** | Does it touch invoice content, numbering, immutability, audit or reports? Cite the rule |

---

## Project Stack

| Aspect | Value |
|---|---|
| Next.js | 16.3 (App Router, Turbopack, `proxy.ts`, async `params`/`searchParams`/`cookies()`, typed `PageProps`/`LayoutProps`) |
| React | 19.3 (ref as a prop — no `forwardRef`) |
| TypeScript | 5.9 strict |
| Styling | Tailwind CSS 4 + CSS variable tokens + centralized CSS in `src/assets/styles` |
| Backend | Supabase: Postgres + row-level security, Auth (`@supabase/ssr` cookies), private Storage |
| Data | Axios (`services/api.ts`, GET-only retry) → SWR → `*SWRProvider` → Zustand 5 |
| Forms | react-hook-form 7 + zod 3 + @hookform/resolvers 3 |
| UI deps | react-select, react-modal, framer-motion 11, @floating-ui/react, simplebar-react, react-icons |
| Dates | dayjs with `Asia/Manila` (`utils/date.ts`) |
| Tests | Vitest (`*.test.ts` next to the util) |
| Formatting | Prettier: single quotes, no semicolons, 4 spaces, width 120 |

> Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before using an unfamiliar
> API (see AGENTS.md).

---

## Folder Structure Rules

```
src/
├── @types/<entity>/      Entity.ts, EntityMeta.ts, index.ts (params + search params), forms/*FormData.ts (zod)
├── app/
│   ├── (auth)/           Public auth pages (centered card layout)
│   ├── (account)/        Signed-in, no organization required (onboarding, account, password)
│   ├── (protected)/      App shell with sidebar — every business page
│   ├── print/            Print views without chrome
│   ├── auth/callback/    Supabase email-link handler
│   └── api/              Route handlers — one folder per resource
├── assets/styles/        app.css → tailwind/, components/_*.css, template/_*.css, print/
├── components/
│   ├── ui/               Primitives (do not modify/delete)
│   ├── shared/           App-wide building blocks
│   ├── template/         Shell: SideNav, Header, MobileNav, OrganizationSwitcher, UserDropdown, …
│   └── <feature>/        e.g. invoices/{list,forms,details,dialogs,print}, customers/{forms,dialogs}
├── configs/              app.config (paths, env-driven names), navigation.config, icons.config, …
├── constants/            roles, actions, permissions, bir, app, theme
├── server/               'server-only': supabase/, auth/, routes/api, data/, eis/, actions/, utils/
├── services/<entity>/    apiX functions + useSWRX hooks
├── stores/               Zustand stores
└── utils/                Pure functions; hooks/ for React hooks; hoc/
```

### File naming

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase `.tsx` | `InvoiceEditor.tsx` |
| Feature folders | kebab/lower case | `components/invoices/forms/` |
| Hooks | `useX.ts` | `useAuthority.ts` |
| Services | `services/<entity>/index.ts` | `services/invoices/index.ts` |
| Types | PascalCase in `@types/<entity>/` | `InvoiceDetails.ts` |
| Form schemas | `@types/<entity>/forms/XFormData.ts` | `InvoiceFormData.ts` |
| Stores | PascalCase `XStore.ts`, hook `useXStore` | `InvoicesStore.ts` |
| Server data | `server/data/<entity>.ts` | `server/data/invoices.ts` |
| API routes | `app/api/<resource>/route.ts` | `app/api/invoices/[id]/issue/route.ts` |
| CSS | `_kebab-case.css` | `_button.css` |
| Migrations | `supabase/migrations/<yyyymmddhhmmss>_<name>.sql` | new file per change |

---

## Component Patterns

```tsx
'use client'

import classNames from '@/utils/classNames'
import type { Invoice } from '@/@types/invoices/Invoice'

interface InvoiceRowProps {
    invoice: Invoice
    className?: string
}

/** One-line doc comment saying what the component is for. */
export default function InvoiceRow({ invoice, className }: InvoiceRowProps) {
    return <div className={classNames('rounded-xl p-4', className)}>{invoice.invoiceNumber}</div>
}
```

- Props are `interface XxxProps`; destructure in the signature; accept `className` and merge with `classNames()`.
- Default export for components; `'use client'` only when needed.
- `@/` imports only; type-only imports use `import type` / `import { type X }`.
- Icons only from `@/configs/icons.config` (add a semantic export there if missing).
- User-facing copy is plain language for business owners, not developer jargon.

---

## Page Pattern (server page → provider → client page)

```tsx
// src/app/(protected)/customers/page.tsx
import type { Metadata } from 'next'
import CustomersSWRProvider from '@/components/customers/CustomersSWRProvider'
import CustomersClientPage from '@/components/customers/CustomersClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Customers' }

export default async function CustomersPage() {
    if (!(await canAccessPage(ACTION_INVOICE_VIEW))) return <Forbidden />
    return (
        <CustomersSWRProvider>
            <CustomersClientPage />
        </CustomersSWRProvider>
    )
}
```

- Dynamic routes: `{ params }: PageProps<'/invoices/[id]'>` then `const { id } = await params`. Run `npx next typegen` after adding routes.
- Client pages set breadcrumbs with `useSetBreadcrumbs([...])` and start with `<PageHeader>`.
- Add the page to `configs/navigation.config` (with its `authority` actions) and an icon to `icons.config`.

---

## Critical Pattern: SWR → Zustand Bridge

```
page.tsx (server, role check) → XSWRProvider (calls useSWRX, syncs) → XStore (Zustand) → components (selectors)
```

1. **Service** (`services/<entity>/index.ts`): `apiGetX`, `apiCreateX`, … using `api.fetchJson`, and `useSWRX(params)`.
2. **Store**: `export const useXStore = createCollectionStore<X, XFilter>(initialFilter)` for paged lists or
   `createResourceStore<T>()` for single resources.
3. **Provider**: reads paging/filter from the store, calls the SWR hook, `useSyncCollection(store, swr)` /
   `useSyncResource(store, swr)`.
4. **Components** read with selectors and call `refreshPage()` / `refresh()` after mutations.

Do not call SWR in leaf components. Exception (existing precedent): self-contained search pickers such as
`CustomerSelect`, `ProductSelect`, `ReferenceInvoiceSelect`.

---

## API Route Pattern

```tsx
// src/app/api/customers/[id]/route.ts
import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { updateCustomer } from '@/server/data/customers'
import { CustomerFormSchema } from '@/@types/customers/forms/CustomerFormData'
import { ACTION_CUSTOMER_MANAGE } from '@/constants/actions.constant'

export const PUT = apiAuthHandler<{ id: string }>(
    async (req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        const payload = await parseJsonBody(req, CustomerFormSchema)
        return getJsonResponse(await updateCustomer(supabase, organizationId, id, payload))
    },
    { action: ACTION_CUSTOMER_MANAGE },
)
```

- `apiAuthHandler` resolves the session, current organization and role, checks `action`, maps errors
  (`ApiError` classes and Postgres codes 42501→403, 23514→400, P0002→404, 23505→409).
- Validate bodies with the same zod schema the form uses (`parseJsonBody` returns `details: [{ field, message }]`
  that forms map back with `tryGetFieldErrors` + `setError`).
- Data access lives in `server/data/*` and uses the **user's** Supabase client (RLS applies). Map snake_case
  rows to camelCase types there. Always filter by `organization_id` too.
- `createAdminSupabase()` (secret key, bypasses RLS) only for inviting users and the cron job.

---

## RBAC (three layers — keep them in sync)

| Layer | Where |
|---|---|
| UI | `useAuthority(ACTION_X)`, `<AuthorityCheck>`, navigation `authority` |
| Server | `canAccessPage(...)` in pages, `apiAuthHandler(..., { action })` in routes |
| Database | `has_org_role(org, array[...])` in RLS policies and SECURITY DEFINER functions |

Roles: `owner`, `admin`, `accountant`, `cashier`, `viewer` (`constants/roles.constant.ts`).
Actions: `constants/actions.constant.ts`. Role → actions: `constants/permissions.constant.ts`.
A new permission needs: action constant, permissions matrix, page/API guard, RLS policy, docs/USER-GUIDE.md.

---

## BIR Rules (non-negotiable)

- All rule constants and citations live in `constants/bir.constant.ts`; calculations in
  `utils/invoices/calculateInvoice.ts`; pre-issue checks in `utils/invoices/validateInvoice.ts`; coverage in
  `utils/compliance/assessCoverage.ts`. Add tests when changing them.
- The server always recalculates invoice amounts; client values are previews.
- Serial numbers are assigned only by `issue_invoice()` in the database. Never assign numbers in TypeScript.
- Issued/voided documents are immutable (DB triggers). Corrections = void with reason, or credit/debit memo.
- Every table change is audited by the `audit_row_change` trigger; add the trigger to new tables.
- Never write "BIR-accredited/approved/certified" in the UI or docs.

---

## Form Pattern

```tsx
const form = useForm<CustomerFormData>({ resolver: zodResolver(CustomerFormSchema), defaultValues })
const { control, handleSubmit, formState: { errors } } = form

<FormProvider {...form}>
    <Form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormItem label="Registered name" asterisk invalid={!!errors.registeredName} errorMessage={errors.registeredName?.message}>
            <Controller name="registeredName" control={control} render={({ field }) => <Input {...field} />} />
        </FormItem>
    </Form>
</FormProvider>
```

- Schemas in `@types/<entity>/forms/`; export `XFormData = z.input<...>` and `XPayload = z.output<...>`.
- Dialog forms: the submit `Button` uses `form={FORM_ID}`; forms rendered inside another form's dialog must
  `e.stopPropagation()` on submit (React bubbles through portals).
- Selects: `<Select<Option<T>> options value={options.find(...)} onChange={(o) => field.onChange(o?.value)} />`.

---

## Styling Rules

- CSS only in `src/assets/styles/` (`@layer components` per file). No CSS modules, no inline hex colors.
- Tokens: `primary`, `primary-deep`, `primary-mild`, `primary-subtle`, `error(-subtle)`, `success(-subtle)`,
  `warning(-subtle)`, `info(-subtle)`, `neutral`, `gray-50…950`.
- Always add `dark:` variants; dark mode is the `dark` class on `<html>`.
- Radius: `rounded-lg` small, `rounded-xl` controls, `rounded-2xl` cards/dialogs. Default control size `sm`.
- Mobile first: tables hide secondary columns with `hideBelow`; the side nav collapses below `lg`.
- Printable views use `print:` utilities and `.print-page`.

---

## Quality Checklist

- [ ] Reused existing ui/shared components, services, stores, utils
- [ ] SWR → Zustand bridge for data; `api.fetchJson` for HTTP
- [ ] Types in `@types`; zod schema shared by form and API
- [ ] Permission checked in UI, page/API and RLS
- [ ] BIR rules respected (recalculated server-side, immutable after issue, audited)
- [ ] New tables: RLS enabled, policies, `updated_at` and audit triggers, new migration file
- [ ] Dark mode, responsive, accessible labels
- [ ] `npm run typecheck`, `npm test`, `npm run lint` pass
- [ ] Docs updated (USER-GUIDE for role changes, BIR-COMPLIANCE for rule changes)

## Anti-Patterns (Do NOT)

- ❌ Create a component that already exists in `ui/` or `shared/`; delete unused `ui/` components
- ❌ Call `fetch`/raw Axios from components — use `services/*`
- ❌ Call SWR in leaf components (except search pickers)
- ❌ Import `src/server/*` or the secret key into client code
- ❌ Bypass RLS with the admin client for normal user actions
- ❌ Compute serial numbers, totals-of-record or VAT only on the client
- ❌ Update or delete issued invoices, invoice lines or audit logs
- ❌ Edit an already-applied migration — add a new one
- ❌ Hard-code colors, use `cn()` instead of `classNames()`, use semicolons or double quotes
- ❌ Claim BIR accreditation in copy
