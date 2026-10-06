# Codebase Architecture Reference — SME e-Invoicing

Detailed reference for the patterns summarized in SKILL.md. Read the files mentioned when you need specifics.

---

## 1. Technology stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.3 | App Router, Turbopack, `proxy.ts`, `output: 'standalone'` |
| React | 19.3 | Ref as a prop; React Compiler lint rules active |
| TypeScript | 5.9 | Strict |
| Tailwind CSS | 4.3 | `@tailwindcss/postcss`, tokens via `@theme inline`, `@tailwindcss/typography` |
| @supabase/ssr, supabase-js | 0.12 / 2.x | Cookie sessions, Postgres + RLS, Storage |
| SWR | 2.5 | Data fetching (bridged into Zustand) |
| Zustand | 5 | Client state |
| Axios + axios-retry | 1.20 / 4 | `services/api.ts` (retries GET only) |
| react-hook-form + zod + @hookform/resolvers | 7 / 3.25 / 3.10 | Forms and shared validation |
| react-select, react-modal, framer-motion 11, @floating-ui/react, simplebar-react | | Used by `components/ui` |
| react-icons | 5.7 | Via `configs/icons.config.tsx` only |
| dayjs | 1.11 | `utils/date.ts` (Asia/Manila) |
| Vitest | 3.2 | Unit tests for pure logic |

---

## 2. Component layers

### Layer 1 — `components/ui/` (primitives)
Alert, Avatar, Badge, Breadcrumbs, Button (+ Save/Delete/Approve/Back), Calendar/DatePicker, Card (+ CardLink),
Checkbox, CloseButton, CollapsibleSection, ConfigProvider, Dialog, Drawer, Dropdown (`Dropdown.Item`),
ExpandableText, FileDownloadLink, Form/FormItem/FormContainer, Image, Input, InputGroup, LinkButton, Menu
(`MenuItem`, `MenuGroup`, `MenuCollapse`), Notification + `toast` helpers (`toastSuccess`, `toastError`,
`toastWarning`, `toastInfo`), Pagination, PDF, Progress (Line/Circle), Radio, ScrollBar, Segment
(`Segment.Item`), Select (+ BadgeSelect, BuildingSelect*), Skeleton, Slider, Spinner, StatusIcon, Steps,
Switcher, Table (`Table.THead/TBody/TFoot/Tr/Th/Td/Sorter`), Tabs (`Tabs.TabList/TabNav/TabContent`), Tag,
TimeInput, Timeline, Tooltip, Video, Audio, hooks/, utils/.

Kept for future use even when unused. *`BuildingSelect` comes from another project and needs a buildings
service that does not exist here; it is not imported anywhere.

Default control size is `sm` (40 px) via `configs/theme.config.ts`. Styles for every primitive live in
`assets/styles/components/_<name>.css`.

### Layer 2 — `components/shared/`
| Component | Use |
|---|---|
| `PageHeader` | Title, description, action buttons at the top of every page |
| `DataTable<T>` | Columns with `cell`, `align`, `hideBelow`; skeleton rows, empty state, error, server paging |
| `ConfirmDialog` | Confirm consequential actions; `confirmForm` submits a form inside the dialog |
| `EmptyState` | Icon, title, guidance, action |
| `StatusBadge` | Renders a `BadgeOption` (`badgeClass`) |
| `StatCard` | Dashboard figure with tone icon |
| `DebounceInput` | Search box that reports after typing stops |
| `Forbidden` | 403 view for pages |
| `AuthorityCheck` | Render children when the role allows an action |
| `Loading`, `Container`, `NavToggle` | Used by ui/template |

### Layer 3 — feature components (`components/<feature>/`)
`invoices/{list,forms,details,dialogs,print}`, `customers/{forms,dialogs}`, `products/{forms,dialogs}`,
`settings/{company,branches,series,users,audit-trail}`, `compliance/`, `registrations/`, `transmissions/`,
`documents/`, `reports/`, `dashboard/`, `auth/`, `account/`, `organization/`, plus one `*SWRProvider` per data
source (e.g. `branches/BranchesSWRProvider.tsx`) and search pickers (`customers/CustomerSelect`,
`products/ProductSelect`, `invoices/ReferenceInvoiceSelect`).

### Template (`components/template/`)
`PostLoginLayout` (sidebar shell), `SideNav`, `SideNavToggle`, `MobileNav`, `VerticalMenuContent` (renders
navigation groups with `MenuGroup`), `Header`, `HeaderSearch` (invoice search), `OrganizationSwitcher`,
`UserDropdown` (account, password, dark mode, sign out), `EnvironmentBanner` (TEST banner), `SimpleLayout`
(account/onboarding), `PageContainer`, `Footer`, `Logo`, `Theme/ThemeProvider` + `ThemeContext`.

---

## 3. Routing and layouts

```
app/layout.tsx              <html>, theme cookie → ThemeProvider, SWRAppConfig, global CSS
├── (auth)/layout.tsx       public centered card: sign-in, sign-up, forgot-password
├── (account)/layout.tsx    requireUser → SessionProvider → SimpleLayout: onboarding, account, account/password
├── (protected)/layout.tsx  requireMember → SessionProvider → PostLoginLayout (sidebar)
│   ├── page.tsx                         dashboard
│   ├── invoices, invoices/new, invoices/[id], invoices/[id]/edit
│   ├── customers, products
│   ├── reports/sales-journal, reports/summary-list-of-sales
│   ├── compliance, compliance/registrations, compliance/transmissions, compliance/documents
│   └── settings/company, settings/branches, settings/series, settings/users, settings/audit-trail
├── print/layout.tsx        requireMember, no chrome: print/invoices/[id]
├── auth/callback/route.ts  Supabase email links (code or token_hash) → accept_invitations → next
└── api/…                   route handlers
```

- `src/proxy.ts` refreshes the Supabase session cookie on every request and redirects signed-out users to
  `/sign-in?next=…` (API routes return 401 themselves).
- `server/auth/guards.ts`: `requireUser()`, `requireMember()` (redirects to onboarding without an
  organization, and to `/account/password?expired=1` when the password is older than
  `PASSWORD_MAX_AGE_DAYS`), `canAccessPage(...actions)`.
- `getServerSessionUser()` (React `cache`) returns `SessionUser` with memberships; the current organization
  comes from the `org` cookie (`POST /api/organizations/switch`).

---

## 4. Data flow

```
Server page (role check)
  └─ <XSWRProvider>                 components/<feature>/XSWRProvider.tsx
       ├─ useSWRX(params)           services/<entity>/index.ts → api.fetchJson → /api/...
       └─ useSyncCollection / useSyncResource → XStore (Zustand)
            └─ Client components read via selectors; mutations call apiX then refreshPage()/refresh()
```

Stores:
- `createCollectionStore<T, F>(initialFilter, size?)` → `page, size, query, filter, records, total, loading,
  validating, error, refreshPage, setPage, setQuery, setFilter, resetFilter…` (CustomersStore, ProductsStore,
  InvoicesStore, TransmissionsStore, AuditLogsStore).
- `createResourceStore<T>()` → `data, loading, validating, error, refresh` (OrganizationStore, BranchesStore,
  SeriesStore, MembersStore, RegistrationsStore, DocumentsStore, ComplianceStore, DashboardStore,
  InvoiceStore, SalesJournalStore, SummaryListOfSalesStore).
- `SessionStore` — hydrated by `SessionProvider` from the server; `useAuthority(action)` reads the role.

---

## 5. API layer

`server/routes/api/index.ts`:
- `apiAuthHandler(handler, { action?, requireOrganization? })` → handler receives
  `(req, ctx, { user, organizationId, role, supabase })`; `ctx.params` is a Promise.
- `apiHandler(handler)` for public/cron routes.
- `parseJsonBody(req, zodSchema)`, `getPaging(searchParams, defaultSize)` → `{ page, size, from, to }`,
  `toSearchPattern(query)` for `ilike` inside `.or()`.

`server/utils/response.ts`: `getJsonResponse`, `getEmptyResponse`, `getFileResponse` (CSV), and
`getApiErrorResponse` mapping `ApiError` subclasses (`@types/errors.ts`: DataError 400, UnauthorizedError 401,
ForbiddenError 403, NotFoundError 404, ConflictError 409) and Postgres codes (42501 → 403, P0002/PGRST116 →
404, 23505 → 409, 23514/23502/23503/22P02/P0001 → 400). All responses are `Cache-Control: private, no-store`.

`server/data/<entity>.ts`: row interfaces (snake_case) + `toX()` mappers + functions taking
`(supabase, organizationId, …)`. Use the user's client from `server/supabase/server.ts`.
`server/supabase/admin.ts` (secret key) is only for `inviteMember` and `/api/cron/transmissions`.

---

## 6. Database (`supabase/migrations/`)

Tables: `profiles`, `organizations`, `organization_members`, `branches`, `document_series`, `customers`,
`products`, `invoices`, `invoice_lines`, `registrations`, `compliance_documents`, `eis_transmissions`,
`coverage_assessments`, `audit_logs`; Storage bucket `compliance-documents` (folder per organization id).

Helpers: `is_org_member(org)`, `has_org_role(org, roles[])` (SECURITY DEFINER, used by every policy).

Functions (RPC):
| Function | Purpose |
|---|---|
| `create_organization(...)` | Onboarding: organization + head office `00000` + owner membership |
| `save_invoice_draft(id, invoice jsonb, lines jsonb)` | Upsert draft + replace lines atomically, recompute totals |
| `issue_invoice(id)` | Role check, per-org advisory lock, series row lock, next serial in range, seller/AC/PTI snapshot, SHA-256 hash chain, EIS queue |
| `void_invoice(id, reason)` | Accountant+, reason ≥ 10 chars, blocked if memos issued or already transmitted |
| `record_invoice_print(id)` | Print counter (ORIGINAL/REPRINT) |
| `log_audit_event(...)` | Non-row events (exports, downloads) |
| `accept_invitations()` | Activates the caller's invited memberships |
| `mark_password_changed()` | Resets the 30-day password clock |

Triggers: `set_updated_at`, `audit_row_change` (all business tables), `enforce_invoice_immutability`,
`enforce_invoice_line_immutability`, `protect_used_series`, `protect_owner_membership`,
`prevent_audit_log_changes`, `set_registration_due_date`, `handle_new_user` (auth.users → profiles).

Schema changes: add a **new** timestamped migration; enable RLS, add policies with `has_org_role`, add the
`updated_at` and `audit_row_change` triggers.

---

## 7. RBAC

| Action | owner | admin | accountant | cashier | viewer |
|---|:-:|:-:|:-:|:-:|:-:|
| invoice:view | ✓ | ✓ | ✓ | ✓ | ✓ |
| invoice:issue | ✓ | ✓ | ✓ | ✓ | |
| invoice:void, memo:issue | ✓ | ✓ | ✓ | | |
| customer:manage | ✓ | ✓ | ✓ | ✓ | |
| customer:delete, product:manage | ✓ | ✓ | ✓ | | |
| report:view, compliance:view | ✓ | ✓ | ✓ | | ✓ |
| compliance:manage, audit:view | ✓ | ✓ | ✓ | | |
| settings:manage, user:manage | ✓ | ✓ | | | |

Source of truth: `constants/permissions.constant.ts` (UI/API) and the RLS policies (database). Owner-only
rules (granting/changing owner, keeping one active owner) are enforced in `server/data/members.ts` and the
`protect_owner_membership` trigger.

---

## 8. BIR domain logic

| File | Content |
|---|---|
| `constants/bir.constant.ts` | VAT rate, thresholds, retention, deadlines, document types, tax treatments, special discounts, registration types/statuses, transmission statuses, document categories, regulatory references — each with its citation |
| `utils/invoices/calculateInvoice.ts` | Line and total calculation (VAT-inclusive/exclusive, trade discount, SC/PWD on VAT-exclusive price → VAT-exempt, withholding on net) |
| `utils/invoices/validateInvoice.ts` | Pre-issue checks (buyer details ≥ ₱1,000 VAT buyers, special discount details, non-VAT rules, memo reference and credit limit, no future dates) |
| `utils/invoices/invoiceNumber.ts` | Serial formatting (min 6 digits), series range text, running-low detection |
| `utils/invoices/invoiceFormData.ts` | Form defaults (new, edit draft, memo from invoice), draft seller preview, active series lookup |
| `utils/compliance/assessCoverage.ts` | RR 26-2025 / RMC 98-2026 coverage decision |
| `utils/compliance/buildChecklist.ts` | Compliance Center checklist and score |
| `components/invoices/details/InvoiceDocument.tsx` | The printed invoice face with every mandatory field |
| `server/eis/*` | `EisProvider` interface, `MockEisProvider`, `BirEisProvider` (JWS RS256), `buildEisPayload` |

Tests live next to these utils (`*.test.ts`); run `npm test`.

---

## 9. Styling

```
assets/styles/
├── app.css                 imports everything below (imported by app/layout.tsx)
├── tailwind/index.css      @import 'tailwindcss', typography plugin, dark variant, :root tokens, @theme inline, base
├── components/index.css    one _<component>.css per ui primitive (@layer components)
├── template/               _header.css, _side-nav.css
└── print/index.css         @media print rules (.print-page)
```

Tokens: `--primary`, `--primary-deep`, `--primary-mild`, `--primary-subtle`, `--error(-subtle)`,
`--success(-subtle)`, `--info(-subtle)`, `--warning(-subtle)`, `--neutral`, `--gray-50…950`. Preset schemas in
`configs/preset-theme-schema.config.ts` override the primary tokens at runtime. Dark mode: `dark` class on
`<html>`, persisted in the `theme` cookie by `server/actions/theme.ts`.

---

## 10. Configuration and environments

- `configs/app.config` — portal/software/provider names and version (env-driven), `isTestEnvironment`, all
  route paths and path builders (`getInvoicePath`, `getNewMemoPath`, …).
- `configs/navigation.config` — grouped sidebar (`type: 'title'` groups with `subMenu` items and `authority`).
- `configs/supabase.config.ts` — public URL and publishable key; `server/env.ts` — server-only secrets
  (`SUPABASE_SECRET_KEY`, `EIS_*`, `CRON_SECRET`, `PASSWORD_MAX_AGE_DAYS`).
- Env templates: `.env.example` (local), `.env.test.example`, `.env.production.example`.

---

## 11. Formatting and linting

Prettier: single quotes, no semicolons, 4 spaces, print width 120, trailing commas. ESLint flat config:
`next/core-web-vitals`, `next/typescript`, `prettier`; React Compiler rules (`react-hooks/refs`,
`react-hooks/set-state-in-effect`) are relaxed only for `components/ui/**`. Prefer `useWatch` over `watch()`
in forms (React Compiler compatibility). Path aliases: `@/*` → `src/*`, `#/*` → `test/*`.
