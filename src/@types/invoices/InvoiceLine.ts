import type { TaxTreatment } from '@/constants/bir.constant'

/** One line on an invoice. Amounts are computed on the server (see utils/invoices/calculateInvoice). */
export interface InvoiceLine {
    id: string
    lineNumber: number
    productId: string | null
    description: string
    unit: string
    quantity: number
    unitPrice: number
    /** Regular (trade) discount amount for the line, in the same VAT basis as the unit price. */
    discountAmount: number
    /** Statutory special discount (SC/PWD/...) applies to this line. */
    specialDiscount: boolean
    /** Effective treatment after special discounts (a special-discount line becomes VAT-exempt). */
    taxTreatment: TaxTreatment
    /** quantity × unit price, as entered. */
    grossAmount: number
    /** Statutory special discount amount. */
    specialDiscountAmount: number
    /** Sale amount excluding VAT, after all discounts. */
    netAmount: number
    vatAmount: number
    /** netAmount + vatAmount */
    totalAmount: number
}
