import { EINVOICING_DEADLINE } from '@/constants/bir.constant'
import type { CoverageAnswers, CoverageResult } from '@/@types/compliance/CoverageAssessment'

const SOURCES = ['RR 26-2025', 'RMC 98-2026', 'RR 8-2022']

/**
 * Who must issue electronic invoices by December 31, 2026 (RR 26-2025; RMC 98-2026 Sec. III–IV):
 *  1. Small, medium and large taxpayers selling online (micro taxpayers are exempt)
 *  2. Taxpayers under the Large Taxpayers Service
 *  3. Large taxpayers under EOPT (RR 8-2024)
 *  4. Taxpayers using CAS/CBA with e-invoicing or other invoicing software
 * Exporters, registered business enterprises and POS-only users are covered later by a separate issuance,
 * unless they also fall under one of the groups above.
 *
 * This is guidance, not a legal opinion — the result tells the user to confirm with their RDO.
 */
export const assessCoverage = (answers: CoverageAnswers): CoverageResult => {
    if (!answers.taxpayerSize) {
        return {
            status: 'incomplete',
            headline: 'Select your taxpayer classification to continue',
            reasons: ['Coverage depends on your EOPT classification (micro, small, medium or large).'],
            deadline: null,
            references: ['RR 8-2024'],
        }
    }

    if (answers.taxpayerSize === 'micro') {
        return {
            status: 'exempt',
            headline: 'Not currently required — micro taxpayers are exempt',
            reasons: [
                'Micro taxpayers (gross sales below ₱3 million) are excluded from every covered group.',
                'You may still adopt e-invoicing voluntarily after getting a Permit to Issue (PTI) from your RDO.',
                'You will have at least 6 months to comply if BIR reclassifies you to a higher category.',
            ],
            deadline: null,
            references: SOURCES,
        }
    }

    const reasons: string[] = []
    if (answers.isLargeTaxpayerService) reasons.push('You are under the Large Taxpayers Service.')
    if (answers.taxpayerSize === 'large') reasons.push('You are classified as a large taxpayer under EOPT.')
    if (answers.sellsOnline) reasons.push('You sell goods or services online (e-commerce).')
    if (answers.usesCasOrInvoicingSoftware) {
        reasons.push('You issue invoices from a computerized accounting system or invoicing software.')
    }

    if (reasons.length > 0) {
        return {
            status: 'required',
            headline: `Required — issue electronic invoices by ${formatDeadline(EINVOICING_DEADLINE)}`,
            reasons: [
                ...reasons,
                'Your head office and all branches must comply together.',
                'Get a Permit to Issue (PTI) before issuing e-invoices, then complete EIS certification within 6 months.',
            ],
            deadline: EINVOICING_DEADLINE,
            references: SOURCES,
        }
    }

    const unanswered = [answers.sellsOnline, answers.isLargeTaxpayerService, answers.usesCasOrInvoicingSoftware].some(
        (answer) => answer === null,
    )
    if (unanswered) {
        return {
            status: 'incomplete',
            headline: 'Answer the remaining questions to see your result',
            reasons: ['Online selling, LTS status and the system you invoice from all affect coverage.'],
            deadline: null,
            references: SOURCES,
        }
    }

    if (answers.isExporter || answers.isRegisteredBusinessEnterprise || answers.usesPosOnly) {
        return {
            status: 'future',
            headline: 'Covered later — BIR will set your deadline in a separate issuance',
            reasons: [
                'Exporters, registered business enterprises and POS-only users are covered once BIR’s system is ready.',
                'If you start using CAS or invoicing software, you fall under the December 31, 2026 deadline.',
            ],
            deadline: null,
            references: SOURCES,
        }
    }

    return {
        status: 'voluntary',
        headline: 'Not currently required — you may adopt e-invoicing voluntarily',
        reasons: [
            'None of the covered groups apply to you based on your answers.',
            'Using this system to issue invoices counts as invoicing software: update your answers once you do.',
        ],
        deadline: null,
        references: SOURCES,
    }
}

const formatDeadline = (date: string) =>
    new Date(`${date}T00:00:00+08:00`).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Manila',
    })
