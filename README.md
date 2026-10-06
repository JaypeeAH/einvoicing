# SME e-Invoicing

Electronic invoicing for Philippine small and medium enterprises, designed to meet the BIR invoicing rules
under the EOPT Act (RR 7-2024), the CAS standards of RMC 5-2021 and the e-invoicing requirements of
RR 8-2022, RR 26-2025 and RMC 98-2026 (deadline **December 31, 2026**).

- Sales invoices, service invoices, credit memos and debit memos with every field BIR requires
- Gap-free serial numbers per branch and document type, inside the registered range
- Issued documents are locked; corrections by void (with reason) or credit/debit memo
- VAT, zero-rated, VAT-exempt and non-VAT sales; senior citizen / PWD / solo parent discounts; withholding
- Sales Journal and Summary List of Sales with CSV export
- Append-only audit trail, role-based access, 30-day password rotation
- BIR registration tracker (COR, CAS AC, PTI, EIS certification, PTT) and e-invoicing coverage check
- EIS transmission queue with a mock provider for testing and a signed (JWS) BIR provider for production
- Multi-business: one login can work for several taxpayers

> BIR does not accredit invoicing software. Each taxpayer registers the system and obtains its own permits.
> See [docs/BIR-COMPLIANCE.md](docs/BIR-COMPLIANCE.md) for the requirement mapping, the taxpayer's steps and
> the known gaps.

## Documentation

| Document | For |
| --- | --- |
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | How to use the app, per role (Owner, Admin, Accountant, Cashier, Viewer) |
| [docs/SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md) | Creating the test and production databases, auth settings, cron, backups |
| [docs/BIR-COMPLIANCE.md](docs/BIR-COMPLIANCE.md) | BIR requirements → implementation, taxpayer steps, gaps |

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres + RLS,
Auth, Storage) · SWR → Zustand · react-hook-form + zod · Vitest.

## Getting started

Prerequisites: Node.js 20.9+ (24 recommended) and a Supabase project (see
[docs/SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md)).

```bash
npm install
cp .env.example .env.local      # fill in your TEST Supabase project URL and keys
npm run dev                     # http://localhost:3000
```

Sign up, confirm your email and complete **Register your business**. The dashboard then guides you through
branches, invoice series and BIR registrations.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server (`output: 'standalone'`) |
| `npm test` | Unit tests (invoice calculation, BIR validation, coverage rules) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Environments

| Environment | Template | Supabase project | `NEXT_PUBLIC_APP_ENV` | `EIS_PROVIDER` |
| --- | --- | --- | --- | --- |
| Local | `.env.example` → `.env.local` | test | `test` | `mock` |
| Test / UAT | `.env.test.example` | test | `test` | `mock` (or `bir` with sandbox credentials during EIS certification) |
| Production | `.env.production.example` | production | `production` | `bir` (once a PTT is held) |

Outside production a yellow **TEST ENVIRONMENT** bar is shown on every page.

### Deploying

Any Node.js host works (`npm run build && npm start`, or the standalone output in `.next/standalone`). On
Vercel, set the variables from `.env.test.example` for *Preview* and `.env.production.example` for
*Production*. Schedule `GET /api/cron/transmissions` (see SUPABASE-SETUP.md §5).

## Project structure

```
src/
├── @types/            Entity types and zod form schemas (forms/ subfolders)
├── app/
│   ├── (auth)/        Sign in, sign up, forgot password
│   ├── (account)/     Onboarding, my account, change password
│   ├── (protected)/   App shell with sidebar: dashboard, invoices, customers, products,
│   │                  reports, compliance, settings
│   ├── print/         Print views (no app chrome)
│   ├── auth/callback  Email link handler (sign-up, invite, password reset)
│   └── api/           Route handlers (authenticated, role-checked)
├── assets/styles/     Tailwind entry, design tokens, component and template CSS
├── components/
│   ├── ui/            UI primitives (Button, Card, Dialog, Form, Select, Table, …)
│   ├── shared/        App-wide building blocks (PageHeader, DataTable, ConfirmDialog, …)
│   ├── template/      Layout shell (SideNav, Header, OrganizationSwitcher, …)
│   └── <feature>/     Feature components (invoices, customers, settings, compliance, …)
├── configs/           App, navigation, icons, theme, Supabase config
├── constants/         Roles, actions, permissions, BIR rules and labels
├── server/            Server-only: Supabase clients, auth guards, data access, EIS providers, API wrappers
├── services/          Client API calls + SWR hooks
├── stores/            Zustand stores (filled by *SWRProvider components)
└── utils/             Invoice calculation, BIR validation, formatting, hooks
supabase/migrations/   Database schema, RLS policies and BIR controls
docs/                  User guide, Supabase setup, BIR compliance
```

How a request flows: **page (server, checks role) → `*SWRProvider` → `services/*` (SWR + Axios) →
`/api/*` route (`apiAuthHandler` checks role) → `server/data/*` → Supabase with the user's session
(row-level security enforces tenant isolation and roles again)**. Issuing and voiding run in database
functions (`issue_invoice`, `void_invoice`) so numbering and immutability cannot be bypassed.

## Contributing

Follow the conventions in [.agent/follow-existing-codebase/SKILL.md](.agent/follow-existing-codebase/SKILL.md):
reuse `components/ui` and `components/shared`, keep the SWR → Zustand data flow, put types and schemas in
`@types`, single quotes, no semicolons, 4-space indentation.
