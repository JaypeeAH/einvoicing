import { describe, expect, it } from 'vitest'
import { getInvoiceIssueProblems, type InvoiceIssueCheckInput } from './validateInvoice'
import { formatSerialNumber, formatSeriesRange, isSeriesRunningLow } from './invoiceNumber'

const base: InvoiceIssueCheckInput = {
    documentType: 'sales_invoice',
    invoiceDate: '2026-10-06',
    sellerVatRegistration: 'vat',
    buyer: { name: 'Juan dela Cruz', businessName: null, tin: null, branchCode: null, address: null, email: null },
    buyerIsVatRegistered: false,
    totalAmount: 500,
    lines: [{ taxTreatment: 'vatable', specialDiscount: false, totalAmount: 500 }],
    specialDiscount: null,
    referenceInvoice: null,
    adjustmentReason: null,
    today: '2026-10-06',
}

const fields = (input: InvoiceIssueCheckInput) => getInvoiceIssueProblems(input).map((problem) => problem.field)

describe('getInvoiceIssueProblems', () => {
    it('accepts a simple retail sale', () => {
        expect(fields(base)).toEqual([])
    })

    it('allows a walk-in sale below ₱1,000 without a buyer name', () => {
        expect(fields({ ...base, buyer: { ...base.buyer, name: '' } })).toEqual([])
    })

    it('requires TIN and address for VAT-registered buyers at ₱1,000 or more', () => {
        expect(fields({ ...base, buyerIsVatRegistered: true, totalAmount: 1000 })).toEqual([
            'buyer.tin',
            'buyer.address',
        ])
    })

    it('rejects future-dated invoices', () => {
        expect(fields({ ...base, invoiceDate: '2026-10-07' })).toContain('invoiceDate')
    })

    it('requires cardholder details for special discounts', () => {
        expect(
            fields({ ...base, lines: [{ taxTreatment: 'vat_exempt', specialDiscount: true, totalAmount: 400 }] }),
        ).toContain('specialDiscount')
    })

    it('stops a credit memo from exceeding the remaining invoice amount', () => {
        const problems = fields({
            ...base,
            documentType: 'credit_memo',
            totalAmount: 300,
            adjustmentReason: 'Returned goods',
            referenceInvoice: {
                status: 'issued',
                documentType: 'sales_invoice',
                totalAmount: 1000,
                creditedAmount: 800,
            },
        })
        expect(problems).toEqual(['lines'])
    })

    it('requires memos to reference an issued invoice and give a reason', () => {
        expect(fields({ ...base, documentType: 'debit_memo' })).toEqual(['referenceInvoiceId', 'adjustmentReason'])
        expect(
            fields({
                ...base,
                documentType: 'credit_memo',
                adjustmentReason: 'Price correction',
                referenceInvoice: {
                    status: 'voided',
                    documentType: 'sales_invoice',
                    totalAmount: 1000,
                    creditedAmount: 0,
                },
            }),
        ).toEqual(['referenceInvoiceId'])
    })
})

describe('invoice numbers', () => {
    it('pads serials to at least 6 digits', () => {
        expect(formatSerialNumber('SI', 42, 4)).toBe('SI-000042')
        expect(formatSerialNumber('', 7, 8)).toBe('00000007')
    })

    it('formats the approved series range', () => {
        expect(formatSeriesRange('SI', 1, 500000, 6)).toBe('SI-000001 to SI-500000')
    })

    it('flags a series that is running out', () => {
        expect(isSeriesRunningLow({ startNumber: 1, nextNumber: 9960, endNumber: 10000 })).toBe(true)
        expect(isSeriesRunningLow({ startNumber: 1, nextNumber: 100, endNumber: 10000 })).toBe(false)
    })
})
