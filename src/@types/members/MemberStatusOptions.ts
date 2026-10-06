import type { BadgeOption } from '@/@types/common'
import type { Member } from './Member'

export const MEMBER_STATUS_OPTIONS: Record<Member['status'], BadgeOption<Member['status']>> = {
    active: { value: 'active', label: 'Active', badgeClass: 'bg-success-subtle text-success' },
    invited: { value: 'invited', label: 'Invited', badgeClass: 'bg-info-subtle text-info' },
    suspended: { value: 'suspended', label: 'Suspended', badgeClass: 'bg-error-subtle text-error' },
}
