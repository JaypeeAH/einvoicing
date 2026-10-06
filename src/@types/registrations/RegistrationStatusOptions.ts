import { REGISTRATION_STATUS_LABELS, type RegistrationStatus } from '@/constants/bir.constant'
import type { BadgeOption } from '@/@types/common'

const NEUTRAL = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'

/** Badge for each BIR registration/permit status. */
export const REGISTRATION_STATUS_OPTIONS: Record<RegistrationStatus, BadgeOption<RegistrationStatus>> = {
    not_started: { value: 'not_started', label: REGISTRATION_STATUS_LABELS.not_started, badgeClass: NEUTRAL },
    preparing: {
        value: 'preparing',
        label: REGISTRATION_STATUS_LABELS.preparing,
        badgeClass: 'bg-info-subtle text-info',
    },
    filed: { value: 'filed', label: REGISTRATION_STATUS_LABELS.filed, badgeClass: 'bg-warning-subtle text-warning' },
    approved: {
        value: 'approved',
        label: REGISTRATION_STATUS_LABELS.approved,
        badgeClass: 'bg-success-subtle text-success',
    },
    rejected: {
        value: 'rejected',
        label: REGISTRATION_STATUS_LABELS.rejected,
        badgeClass: 'bg-error-subtle text-error',
    },
    revoked: { value: 'revoked', label: REGISTRATION_STATUS_LABELS.revoked, badgeClass: 'bg-error-subtle text-error' },
}
