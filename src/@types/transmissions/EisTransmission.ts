import type { DocumentType, TransmissionStatus } from '@/constants/bir.constant'

/** One e-invoice sent to the EIS. A document with mixed tax classifications is sent as several. */
export interface EisTransmissionDocument {
    /** EIS unique invoice ID (24 characters). */
    uniqueId: string
    /** 01 VATable, 02 zero-rated, 03 VAT-exempt, 04 RBE local sales. */
    transClass: string
    status: TransmissionStatus
    /** SUC001 when registered; SYN0xx/ERR0xx or an API error code otherwise. */
    resultCode: string | null
    resultMessage: string | null
}

/** One issued document queued for (or sent to) the BIR Electronic Invoicing System. */
export interface EisTransmission {
    id: string
    organizationId: string
    invoiceId: string
    invoiceNumber: string | null
    documentType: DocumentType
    status: TransmissionStatus
    attempts: number
    lastAttemptAt: string | null
    /** Transmission deadline: 3 calendar days after issue. */
    dueAt: string
    /** EIS unique invoice IDs of the e-invoices sent for this document. */
    birReference: string | null
    responseMessage: string | null
    createdAt: string
    documents: EisTransmissionDocument[]
}
