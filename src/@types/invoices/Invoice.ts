import type { DocumentType, InvoiceStatus, TransmissionStatus } from '@/constants/bir.constant'
import type { InvoiceTotals } from './InvoiceTotals'

/** Invoice as listed in tables. See InvoiceDetails for the full document. */
export interface Invoice extends InvoiceTotals {
    id: string
    organizationId: string
    branchId: string
    branchCode: string
    documentType: DocumentType
    status: InvoiceStatus
    /** Formatted serial number, assigned when issued (null for drafts). */
    invoiceNumber: string | null
    invoiceDate: string
    dueDate: string | null
    customerId: string | null
    buyerName: string
    buyerTin: string | null
    currency: 'PHP'
    transmissionStatus: TransmissionStatus | null
    issuedAt: string | null
    voidedAt: string | null
    createdAt: string
    updatedAt: string
}
