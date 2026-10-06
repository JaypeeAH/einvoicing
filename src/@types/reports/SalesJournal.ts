import type { DocumentType, InvoiceStatus } from '@/constants/bir.constant'

export interface SalesAmounts {
    grossAmount: number
    discountAmount: number
    vatableSales: number
    vatAmount: number
    zeroRatedSales: number
    vatExemptSales: number
    nonVatSales: number
    totalAmount: number
}

/** One row of the Sales Journal (RR 9-2009 book fields). Voided documents are listed with zero amounts. */
export interface SalesJournalRow extends SalesAmounts {
    id: string
    invoiceDate: string
    invoiceNumber: string
    documentType: DocumentType
    status: InvoiceStatus
    branchCode: string
    buyerTin: string | null
    buyerName: string
    buyerAddress: string | null
    description: string
}

export interface ReportHeader {
    registeredName: string
    businessName: string | null
    address: string
    tin: string
    vatRegistration: string
    softwareName: string
    softwareVersion: string
    generatedAt: string
    generatedBy: string
}

export interface SalesJournal {
    header: ReportHeader
    from: string
    to: string
    branchId: string | null
    rows: SalesJournalRow[]
    totals: SalesAmounts
}
