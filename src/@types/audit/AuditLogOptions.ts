import type { BadgeOption } from '@/@types/common'
import type { AuditLog } from './AuditLog'

type AuditAction = AuditLog['action']

const NEUTRAL = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'

export const AUDIT_ACTION_OPTIONS: Record<AuditAction, BadgeOption<AuditAction>> = {
    insert: { value: 'insert', label: 'Created', badgeClass: 'bg-success-subtle text-success' },
    update: { value: 'update', label: 'Changed', badgeClass: 'bg-info-subtle text-info' },
    delete: { value: 'delete', label: 'Deleted', badgeClass: 'bg-error-subtle text-error' },
    issue: { value: 'issue', label: 'Issued', badgeClass: 'bg-primary-subtle text-primary' },
    void: { value: 'void', label: 'Voided', badgeClass: 'bg-warning-subtle text-warning' },
    print: { value: 'print', label: 'Printed', badgeClass: NEUTRAL },
    download: { value: 'download', label: 'Downloaded', badgeClass: NEUTRAL },
    export: { value: 'export', label: 'Exported', badgeClass: NEUTRAL },
}

/** Tables the audit trail records, with plain-language names. */
export const AUDIT_ENTITY_TYPE_LABELS: Record<string, string> = {
    invoices: 'Invoices & memos',
    customers: 'Customers',
    products: 'Products & services',
    branches: 'Branches',
    document_series: 'Invoice series',
    organizations: 'Company profile',
    organization_members: 'Users',
    registrations: 'BIR registrations',
    compliance_documents: 'Compliance documents',
    eis_transmissions: 'EIS transmissions',
    coverage_assessments: 'E-invoicing coverage checks',
    reports: 'Reports',
}

export const getAuditEntityTypeLabel = (entityType: string) => AUDIT_ENTITY_TYPE_LABELS[entityType] ?? entityType
