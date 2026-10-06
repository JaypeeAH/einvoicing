import { z } from 'zod'
import { TAXPAYER_SIZES } from '@/constants/bir.constant'

export const CoverageAnswersSchema = z.object({
    taxpayerSize: z.enum(TAXPAYER_SIZES).nullable(),
    sellsOnline: z.boolean().nullable(),
    isLargeTaxpayerService: z.boolean().nullable(),
    usesCasOrInvoicingSoftware: z.boolean().nullable(),
    isExporter: z.boolean().nullable(),
    isRegisteredBusinessEnterprise: z.boolean().nullable(),
    usesPosOnly: z.boolean().nullable(),
})

export type CoverageAnswers = z.infer<typeof CoverageAnswersSchema>

/**
 * - `required`: must issue e-invoices by the deadline
 * - `exempt`: micro taxpayer, not currently required
 * - `future`: covered by a later BIR issuance (exporters, RBEs, POS-only)
 * - `voluntary`: not covered, may adopt with a PTI
 * - `incomplete`: answer the remaining questions first
 */
export type CoverageStatus = 'required' | 'exempt' | 'future' | 'voluntary' | 'incomplete'

export interface CoverageResult {
    status: CoverageStatus
    headline: string
    reasons: string[]
    deadline: string | null
    references: string[]
}

export interface CoverageAssessment {
    id: string
    answers: CoverageAnswers
    result: CoverageResult
    assessedByName: string | null
    createdAt: string
}
