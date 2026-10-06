import type { DocumentType, TransmissionStatus } from '@/constants/bir.constant'

/** One invoice queued for (or sent to) the BIR Electronic Invoicing System. */
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
    birReference: string | null
    responseMessage: string | null
    createdAt: string
}
