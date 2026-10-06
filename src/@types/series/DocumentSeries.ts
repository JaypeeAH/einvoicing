import type { DocumentType } from '@/constants/bir.constant'

/**
 * A registered serial-number range for one document type at one branch (RMC 5-2021: the system controls
 * numbering, unique per document type and branch). Numbers are assigned only when a document is issued.
 */
export interface DocumentSeries {
    id: string
    organizationId: string
    branchId: string
    branchCode: string
    branchName: string
    documentType: DocumentType
    prefix: string
    startNumber: number
    endNumber: number
    nextNumber: number
    /** Number of digits, zero-padded (minimum 6). */
    padding: number
    /** CAS Acknowledgment Certificate control number (ACCN) or PTU / ATP number printed on the document. */
    acNumber: string
    acDate: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}
