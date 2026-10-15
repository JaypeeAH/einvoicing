import 'server-only'

import { randomBytes } from 'node:crypto'
import dayjs from 'dayjs'
import { generateSubmitId } from './crypto'
import { getEisDocumentProblems } from './format'
import type { EisGateway, EisInquiryResult, EisOutgoingDocument, EisSubmissionAck } from './types'

/** EIS Cert Number used in e-invoice unique IDs while simulating (no real accreditation). */
export const MOCK_ACCREDITATION_ID = '99999999'

/**
 * Simulates the BIR EIS for development and test environments: acknowledges every submission and, on
 * inquiry, runs the format checks BIR performs (structure, formulas, sign and VAT rules). Nothing leaves
 * the app.
 */
export class MockEisGateway implements EisGateway {
    readonly name = 'Simulated EIS (test environment — not sent to BIR)'
    readonly simulated = true
    readonly environment = 'sandbox' as const

    constructor(readonly accreditationId: string = MOCK_ACCREDITATION_ID) {}

    async submit(): Promise<EisSubmissionAck> {
        return {
            submitId: generateSubmitId(this.accreditationId),
            ackId: `BIR-${dayjs().format('YYYYMMDDHHmmss')}-${randomBytes(3).toString('hex').slice(0, 5).toUpperCase()}`,
            description: 'Transmission received (simulated).',
        }
    }

    async inquire(_submitId: string, documents: EisOutgoingDocument[]): Promise<EisInquiryResult> {
        return {
            state: 'completed',
            documents: documents.map(({ uniqueId, document }) => {
                const problems = getEisDocumentProblems(document, this.accreditationId)
                return problems.length
                    ? { uniqueId, code: 'SYN004', description: problems.join(' ') }
                    : { uniqueId, code: 'SUC001', description: null }
            }),
        }
    }
}
