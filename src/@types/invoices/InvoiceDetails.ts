import type { SpecialDiscountType, VatRegistration } from '@/constants/bir.constant'
import type { Invoice } from './Invoice'
import type { InvoiceLine } from './InvoiceLine'

/** Seller details copied onto the invoice when it is issued, so the printed invoice never changes. */
export interface InvoiceSeller {
    registeredName: string
    businessName: string | null
    tin: string
    branchCode: string
    address: string
    vatRegistration: VatRegistration
    /** CAS Acknowledgment Certificate control number (ACCN) */
    acNumber: string | null
    acDate: string | null
    /** Approved serial range, e.g. "SI-000001 to SI-500000" */
    seriesRange: string | null
    /** Permit to Issue electronic invoices */
    ptiNumber: string | null
}

export interface InvoiceBuyer {
    name: string
    businessName: string | null
    tin: string | null
    branchCode: string | null
    address: string | null
    email: string | null
}

export interface InvoiceSpecialDiscount {
    type: SpecialDiscountType
    idNumber: string
    holderName: string
    holderTin: string | null
}

export interface InvoiceReference {
    id: string
    invoiceNumber: string | null
    invoiceDate: string
    documentType: Invoice['documentType']
    totalAmount: number
}

export interface InvoiceDetails extends Invoice {
    seller: InvoiceSeller | null
    buyer: InvoiceBuyer
    lines: InvoiceLine[]
    pricesIncludeVat: boolean
    paymentTerms: string | null
    withholdingTaxRate: number
    specialDiscount: InvoiceSpecialDiscount | null
    /** Credit/debit memos: the invoice being adjusted. */
    referenceInvoice: InvoiceReference | null
    adjustmentReason: string | null
    /** Replaces a manual invoice issued during system downtime (RMC 98-2026 Sec. IV.11). */
    manualInvoiceReference: string | null
    notes: string | null
    /** Memos issued against this invoice. */
    adjustments: InvoiceReference[]
    integrityHash: string | null
    printCount: number
    issuedByName: string | null
    voidReason: string | null
    voidedByName: string | null
    createdByName: string | null
}
