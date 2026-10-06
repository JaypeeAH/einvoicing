import {
    INVOICE_STATUS_LABELS,
    TRANSMISSION_STATUS_LABELS,
    type InvoiceStatus,
    type TransmissionStatus,
} from '@/constants/bir.constant'
import type { BadgeOption } from '@/@types/common'

const NEUTRAL = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'

export const INVOICE_STATUS_OPTIONS: Record<InvoiceStatus, BadgeOption<InvoiceStatus>> = {
    draft: { value: 'draft', label: INVOICE_STATUS_LABELS.draft, badgeClass: NEUTRAL },
    issued: { value: 'issued', label: INVOICE_STATUS_LABELS.issued, badgeClass: 'bg-success-subtle text-success' },
    voided: { value: 'voided', label: INVOICE_STATUS_LABELS.voided, badgeClass: 'bg-error-subtle text-error' },
}

export const TRANSMISSION_STATUS_OPTIONS: Record<TransmissionStatus, BadgeOption<TransmissionStatus>> = {
    queued: { value: 'queued', label: TRANSMISSION_STATUS_LABELS.queued, badgeClass: NEUTRAL },
    sent: { value: 'sent', label: TRANSMISSION_STATUS_LABELS.sent, badgeClass: 'bg-info-subtle text-info' },
    accepted: {
        value: 'accepted',
        label: TRANSMISSION_STATUS_LABELS.accepted,
        badgeClass: 'bg-success-subtle text-success',
    },
    rejected: {
        value: 'rejected',
        label: TRANSMISSION_STATUS_LABELS.rejected,
        badgeClass: 'bg-error-subtle text-error',
    },
    failed: { value: 'failed', label: TRANSMISSION_STATUS_LABELS.failed, badgeClass: 'bg-warning-subtle text-warning' },
    cancelled: { value: 'cancelled', label: TRANSMISSION_STATUS_LABELS.cancelled, badgeClass: NEUTRAL },
}
