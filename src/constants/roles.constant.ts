// Organization member roles. Mirrors the `member_role` enum in the database.

export const ROLE_OWNER = 'owner'
export const ROLE_ADMIN = 'admin'
export const ROLE_ACCOUNTANT = 'accountant'
export const ROLE_CASHIER = 'cashier'
export const ROLE_VIEWER = 'viewer'

export const ROLES = [ROLE_OWNER, ROLE_ADMIN, ROLE_ACCOUNTANT, ROLE_CASHIER, ROLE_VIEWER] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    accountant: 'Accountant',
    cashier: 'Cashier / Billing',
    viewer: 'Viewer (read-only)',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
    owner: 'Full access, including users and company registration details. Every organization has at least one owner.',
    admin: 'Manages company settings, branches, invoice series and users. Can do everything an accountant can.',
    accountant: 'Issues and voids invoices, credit and debit memos, runs reports and maintains BIR registrations.',
    cashier: 'Creates customers and issues sales invoices. Cannot void invoices or change settings.',
    viewer: 'Read-only access to invoices, reports and compliance status (e.g. external auditor).',
}
