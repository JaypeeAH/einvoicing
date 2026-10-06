import 'server-only'

import { createHash } from 'node:crypto'
import type { EisInvoicePayload, EisProvider, EisTransmitResult } from './types'

/**
 * Simulates the BIR EIS for development and test environments. It applies the structural checks BIR
 * performs (seller TIN, document number, totals) so rejected-transmission handling can be exercised.
 * It never contacts BIR.
 */
export class MockEisProvider implements EisProvider {
    readonly name = 'Mock EIS (test environment — not sent to BIR)'

    async transmit(payload: EisInvoicePayload): Promise<EisTransmitResult> {
        if (!/^\d{3}-\d{3}-\d{3}$/.test(payload.seller.tin)) {
            return {
                status: 'rejected',
                birReference: null,
                responseCode: 'E001',
                responseMessage: 'Invalid seller TIN.',
            }
        }
        if (payload.lines.length === 0) {
            return { status: 'rejected', birReference: null, responseCode: 'E002', responseMessage: 'No line items.' }
        }
        const lineTotal = payload.lines.reduce((sum, line) => sum + line.totalAmount, 0)
        if (Math.abs(lineTotal - payload.totals.totalAmount) > 0.01) {
            return {
                status: 'rejected',
                birReference: null,
                responseCode: 'E003',
                responseMessage: 'Line totals do not match the document total.',
            }
        }
        const reference = createHash('sha256')
            .update(`${payload.seller.tin}${payload.seller.branchCode}${payload.invoiceNumber}`)
            .digest('hex')
            .slice(0, 24)
            .toUpperCase()
        return {
            status: 'accepted',
            birReference: `MOCK-${reference}`,
            responseCode: '200',
            responseMessage: 'Accepted (mock).',
        }
    }
}
