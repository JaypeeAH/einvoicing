import type { CoverageAssessment } from './CoverageAssessment'
import type { Registration } from '@/@types/registrations/Registration'

export type ChecklistState = 'done' | 'action' | 'pending' | 'not_applicable'

export interface ChecklistItem {
    key: string
    title: string
    description: string
    state: ChecklistState
    href?: string
    reference?: string
}

/** Readiness summary for the Compliance Center. */
export interface ComplianceStatus {
    assessment: CoverageAssessment | null
    registrations: Registration[]
    checklist: ChecklistItem[]
    /** Percentage of applicable checklist items that are done. */
    score: number
}
