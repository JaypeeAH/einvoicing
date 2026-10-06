import type { CoverageStatus } from './CoverageAssessment'
import type { BadgeOption } from '@/@types/common'

const NEUTRAL = 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'

/** Badge for each e-invoicing coverage result. */
export const COVERAGE_STATUS_OPTIONS: Record<CoverageStatus, BadgeOption<CoverageStatus>> = {
    required: { value: 'required', label: 'Required', badgeClass: 'bg-warning-subtle text-warning' },
    exempt: { value: 'exempt', label: 'Exempt for now', badgeClass: 'bg-success-subtle text-success' },
    future: { value: 'future', label: 'Covered later', badgeClass: 'bg-info-subtle text-info' },
    voluntary: { value: 'voluntary', label: 'Voluntary', badgeClass: 'bg-success-subtle text-success' },
    incomplete: { value: 'incomplete', label: 'Incomplete', badgeClass: NEUTRAL },
}
