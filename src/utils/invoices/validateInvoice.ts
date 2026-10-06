import {
    BUYER_DETAILS_THRESHOLD,
    MEMO_DOCUMENT_TYPES,
    type DocumentType,
    type TaxTreatment,
    type VatRegistration,
} from '@/constants/bir.constant'
import type { InvoiceBuyer, InvoiceSpecialDiscount } from '@/@types/invoices/InvoiceDetails'

export interface InvoiceIssueCheckInput {
    documentType: DocumentType
    invoiceDate: string
    sellerVatRegistration: VatRegistration
    buyer: InvoiceBuyer
    buyerIsVatRegistered: boolean
    totalAmount: number
    lines: { taxTreatment: TaxTreatment; specialDiscount: boolean; totalAmount: number }[]
    specialDiscount: InvoiceSpecialDiscount | null
    referenceInvoice: { status: string; documentType: DocumentType; totalAmount: number; creditedAmount: number } | null
    adjustmentReason: string | null
    today: string
}

export interface InvoiceIssueProblem {
    field: string
    message: string
}

/**
 * BIR rules checked before a document receives its serial number. Once issued it can only be voided,
 * so every problem here blocks issuing.
 */
export const getInvoiceIssueProblems = (input: InvoiceIssueCheckInput): InvoiceIssueProblem[] => {
    const problems: InvoiceIssueProblem[] = []

    if (input.lines.length === 0) {
        problems.push({ field: 'lines', message: 'Add at least one line.' })
    }

    if (input.invoiceDate > input.today) {
        problems.push({ field: 'invoiceDate', message: 'The invoice date cannot be in the future.' })
    }

    // Buyer details for sales of PHP 1,000 or more to VAT-registered buyers (RR 7-2024 Sec. 6(B))
    const needsBuyerDetails = input.buyerIsVatRegistered || !!input.buyer.tin
    if (needsBuyerDetails || input.totalAmount >= BUYER_DETAILS_THRESHOLD) {
        if (!input.buyer.name) {
            problems.push({ field: 'buyer.name', message: 'Enter the buyer’s registered name.' })
        }
    }
    if (needsBuyerDetails && input.totalAmount >= BUYER_DETAILS_THRESHOLD) {
        if (!input.buyer.tin) problems.push({ field: 'buyer.tin', message: 'Enter the buyer’s TIN.' })
        if (!input.buyer.address) problems.push({ field: 'buyer.address', message: 'Enter the buyer’s address.' })
    }

    // Special discounts need the cardholder's ID (RR 7-2024; RA 9994 / RA 10754 IRR)
    const hasSpecialDiscountLine = input.lines.some((line) => line.specialDiscount)
    if (hasSpecialDiscountLine && !input.specialDiscount) {
        problems.push({ field: 'specialDiscount', message: 'Enter the discount cardholder’s name and ID number.' })
    }
    if (input.lines.some((line) => line.specialDiscount && line.taxTreatment === 'zero_rated')) {
        problems.push({ field: 'lines', message: 'Special discounts do not apply to zero-rated sales.' })
    }

    if (input.sellerVatRegistration === 'non_vat' && input.lines.some((line) => line.taxTreatment === 'vatable')) {
        problems.push({ field: 'lines', message: 'A non-VAT registered seller cannot issue VATable sales.' })
    }

    // Credit and debit memos must reference an issued invoice (RMC 98-2026 Sec. IV.8)
    if (MEMO_DOCUMENT_TYPES.includes(input.documentType)) {
        if (!input.referenceInvoice) {
            problems.push({ field: 'referenceInvoiceId', message: 'Select the invoice this memo adjusts.' })
        } else {
            if (input.referenceInvoice.status !== 'issued') {
                problems.push({ field: 'referenceInvoiceId', message: 'Only issued invoices can be adjusted.' })
            }
            if (MEMO_DOCUMENT_TYPES.includes(input.referenceInvoice.documentType)) {
                problems.push({
                    field: 'referenceInvoiceId',
                    message: 'A memo must reference an invoice, not another memo.',
                })
            }
            if (input.documentType === 'credit_memo') {
                const available = input.referenceInvoice.totalAmount - input.referenceInvoice.creditedAmount
                if (input.totalAmount > available + 0.001) {
                    problems.push({
                        field: 'lines',
                        message: `The credit memo exceeds the remaining invoice amount (${available.toFixed(2)}).`,
                    })
                }
            }
        }
        if (!input.adjustmentReason) {
            problems.push({ field: 'adjustmentReason', message: 'Explain the reason for the adjustment.' })
        }
    }

    if (input.totalAmount <= 0) {
        problems.push({ field: 'lines', message: 'The total must be more than zero.' })
    }

    return problems
}
