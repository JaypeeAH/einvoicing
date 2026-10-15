import { describe, expect, it } from 'vitest'
import { calculateInvoice, type CalculateLineInput } from '@/utils/invoices/calculateInvoice'
import type { InvoiceDetails } from '@/@types/invoices/InvoiceDetails'
import type { SpecialDiscountType } from '@/constants/bir.constant'
import { allocate, buildEisDocuments, getEisDocumentProblems, NO_PREVIOUS_UNIQUE_ID } from './format'

const ACCREDITATION = '20000001'

interface LineInput extends CalculateLineInput {
    description: string
}

/** An issued document built with the app's own calculation, as the transmission job would load it. */
const makeInvoice = (
    lines: LineInput[],
    overrides: Partial<InvoiceDetails> & {
        specialDiscountType?: SpecialDiscountType
        withholdingTaxRate?: number
    } = {},
): InvoiceDetails => {
    const { specialDiscountType, withholdingTaxRate = 0, ...rest } = overrides
    const { lines: calculated, totals } = calculateInvoice({
        lines,
        pricesIncludeVat: rest.pricesIncludeVat ?? true,
        sellerVatRegistration: 'vat',
        specialDiscountType: specialDiscountType ?? null,
        withholdingTaxRate,
    })
    return {
        id: 'invoice-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        branchCode: '00000',
        documentType: 'sales_invoice',
        status: 'issued',
        invoiceNumber: '55510000028',
        invoiceDate: '2020-11-10',
        dueDate: null,
        customerId: null,
        buyerName: 'AAA Corporation',
        buyerTin: '444-444-444',
        currency: 'PHP',
        ...totals,
        transmissionStatus: null,
        issuedAt: '2020-11-10T02:00:00Z',
        voidedAt: null,
        createdAt: '2020-11-10T01:00:00Z',
        updatedAt: '2020-11-10T02:00:00Z',
        seller: {
            registeredName: 'Pharmaceutical Company',
            businessName: 'Pharmaceutical Company',
            tin: '123-456-789',
            branchCode: '00000',
            address: 'Manalao Avenue 1632 Taguig City',
            vatRegistration: 'vat',
            acNumber: 'FP012345-011-0123456-00001',
            acDate: '2020-01-01',
            seriesRange: null,
            ptiNumber: null,
        },
        buyer: {
            name: 'AAA Corporation',
            businessName: 'AAA Corporation',
            tin: '444-444-444',
            branchCode: '00000',
            address: '23rd Flr. Citibank Tower 8741 Paseo de Roxas, Salcedo Village 1227',
            email: 'purchase@aaacorp.co.ph',
        },
        lines: calculated.map((line, index) => ({
            ...line,
            id: `line-${index + 1}`,
            lineNumber: index + 1,
            productId: null,
            description: lines[index].description,
            unit: 'Set',
            quantity: lines[index].quantity,
            unitPrice: lines[index].unitPrice,
            specialDiscount: !!lines[index].specialDiscount,
        })),
        pricesIncludeVat: true,
        paymentTerms: null,
        withholdingTaxRate,
        specialDiscount: specialDiscountType
            ? { type: specialDiscountType, idNumber: '12345', holderName: 'Juan Dela Cruz', holderTin: null }
            : null,
        referenceInvoice: null,
        adjustmentReason: null,
        correctionCode: null,
        manualInvoiceReference: null,
        notes: null,
        adjustments: [],
        integrityHash: 'hash',
        printCount: 0,
        issuedByName: null,
        voidReason: null,
        voidedByName: null,
        createdByName: null,
        ...rest,
    }
}

let counter = 0
const context = {
    sellerEmail: 'pharmaceutical@gmail.com',
    uniqueIdFor: () => `20201110${ACCREDITATION}${String(++counter).padStart(8, '0')}`,
}

// API guide chapter 5.2: one CAS invoice with VATable, zero-rated and VAT-exempt items (prices include VAT)
const pharmaLines: LineInput[] = [
    {
        description: 'MICARDIS.TABS/30/40MG BLIBR',
        quantity: 5,
        unitPrice: 100,
        discountAmount: 150,
        taxTreatment: 'vatable',
    },
    { description: 'MICARDIS.TABS/30/40MG BLIBR', quantity: 5, unitPrice: 100, taxTreatment: 'vatable' },
    { description: "Micardis 40mg PS 1's", quantity: 1, unitPrice: 1000, taxTreatment: 'zero_rated' },
    { description: "Glyxambi Tablet 10mg/5mg 30's", quantity: 1, unitPrice: 50, taxTreatment: 'vat_exempt' },
]

describe('buildEisDocuments', () => {
    it("splits a mixed invoice into one e-invoice per classification, matching BIR's example", () => {
        const invoice = makeInvoice(pharmaLines)
        expect(invoice.totalAmount).toBe(1900)

        const documents = buildEisDocuments(invoice, context)
        expect(documents.map((item) => item.transClass)).toEqual(['01', '02', '03'])
        const [vatable, zeroRated, exempt] = documents.map((item) => item.document)

        // JSON-01 of the guide: TotNetItemSales 758.93, VAT 91.07, NetAmtPay 850.00
        expect(vatable.CompInvoiceId).toBe('55510000028')
        expect(vatable.DocType).toBe('01')
        expect(vatable.CorrYN).toBe('N')
        expect(vatable.ItemList.map((item) => [item.UnitCost, item.SalesAmt, item.NetSales])).toEqual([
            [89.29, 446.43, 312.5],
            [89.29, 446.43, 446.43],
        ])
        expect(vatable.TotNetItemSales).toBe(758.93)
        expect(vatable.TotNetSalesAftDisct).toBe(758.93)
        expect(vatable.VATAmt).toBe(91.07)
        expect(vatable.NetAmtPay).toBe(850)

        // JSON-02 and JSON-03
        expect([zeroRated.TotNetItemSales, zeroRated.VATAmt, zeroRated.NetAmtPay]).toEqual([1000, 0, 1000])
        expect([exempt.TotNetItemSales, exempt.VATAmt, exempt.NetAmtPay]).toEqual([50, 0, 50])

        // Same document number, different unique IDs, BIR formats for TIN and branch
        expect(new Set(documents.map((item) => item.document.EisUniqueId)).size).toBe(3)
        expect(vatable.SellerInfo).toMatchObject({ Tin: '123456789', BranchCd: '00000', Type: '0' })
        expect(vatable.BuyerInfo).toMatchObject({ Tin: '444444444', BranchCd: '00000', RegNm: 'AAA Corporation' })
        expect(vatable.PtuNum).toBe('FP012345-011-0123456-00001')

        for (const { document } of documents) {
            expect(getEisDocumentProblems(document, ACCREDITATION)).toEqual([])
        }
    })

    it('uses 000000000 for buyers without a TIN', () => {
        const invoice = makeInvoice([pharmaLines[1]], {
            buyer: { name: '', businessName: null, tin: null, branchCode: null, address: null, email: null },
        })
        const [{ document }] = buildEisDocuments(invoice, context)
        expect(document.BuyerInfo).toMatchObject({ Tin: '000000000', BranchCd: '00000', RegNm: 'Walk-in customer' })
        expect(getEisDocumentProblems(document, ACCREDITATION)).toEqual([])
    })

    it('reports senior citizen discounts at document level on a VAT-exempt e-invoice', () => {
        const invoice = makeInvoice(
            [{ description: 'Medicine', quantity: 1, unitPrice: 112, taxTreatment: 'vatable', specialDiscount: true }],
            { specialDiscountType: 'senior_citizen' },
        )
        const [{ transClass, document }] = buildEisDocuments(invoice, context)
        expect(transClass).toBe('03')
        expect(document.ItemList[0]).toMatchObject({ SalesAmt: 100, RegDscntAmt: 0, NetSales: 100 })
        expect(document.Discount).toMatchObject({ ScAmt: 20, PwdAmt: 0, SpeAmt: 0 })
        expect(document.TotNetSalesAftDisct).toBe(80)
        expect(document.VATAmt).toBe(0)
        expect(document.NetAmtPay).toBe(80)
        expect(getEisDocumentProblems(document, ACCREDITATION)).toEqual([])
    })

    it('splits withholding tax across the e-invoices and keeps the amount due', () => {
        const invoice = makeInvoice(pharmaLines, { withholdingTaxRate: 0.01 })
        const documents = buildEisDocuments(invoice, context).map((item) => item.document)
        const withheld = documents.reduce((sum, document) => sum + document.WithholdIncome, 0)
        const payable = documents.reduce((sum, document) => sum + document.NetAmtPay, 0)
        expect(Math.round(withheld * 100) / 100).toBe(invoice.withholdingTaxAmount)
        expect(Math.round(payable * 100) / 100).toBe(invoice.amountDue)
        for (const document of documents) expect(getEisDocumentProblems(document, ACCREDITATION)).toEqual([])
    })

    it('sends credit memos as negative corrections that point to the original e-invoice', () => {
        const memo = makeInvoice([pharmaLines[1]], {
            documentType: 'credit_memo',
            invoiceNumber: 'CM-000001',
            correctionCode: '05',
            adjustmentReason: 'Damaged items returned',
            referenceInvoice: {
                id: 'invoice-0',
                invoiceNumber: '55510000028',
                invoiceDate: '2020-11-10',
                documentType: 'sales_invoice',
                totalAmount: 1900,
            },
        })
        const [{ document }] = buildEisDocuments(memo, {
            ...context,
            referenceUniqueIds: { '01': '202011102000000100000001', '02': '202011102000000100000002' },
        })
        expect(document).toMatchObject({
            DocType: '03',
            CorrYN: 'Y',
            CorrectionCd: '05',
            PrevUniqueId: '202011102000000100000001',
        })
        expect(document.Rmk1).toContain('55510000028')
        expect(document.Rmk1).toContain('202011102000000100000002')
        expect(document.ItemList[0]).toMatchObject({ Qty: 5, SalesAmt: -446.43, NetSales: -446.43 })
        expect(document.VATAmt).toBe(-53.57)
        expect(document.NetAmtPay).toBe(-500)
        expect(getEisDocumentProblems(document, ACCREDITATION)).toEqual([])
    })

    it('reports a debit memo as an invoice correcting the original (v2.1 has no debit memo type)', () => {
        const memo = makeInvoice([pharmaLines[1]], {
            documentType: 'debit_memo',
            referenceInvoice: {
                id: 'invoice-0',
                invoiceNumber: '55510000028',
                invoiceDate: '2020-11-10',
                documentType: 'sales_invoice',
                totalAmount: 1900,
            },
        })
        const [{ document }] = buildEisDocuments(memo, context)
        expect(document).toMatchObject({ DocType: '01', CorrYN: 'Y', CorrectionCd: '03' })
        expect(document.PrevUniqueId).toBe(NO_PREVIOUS_UNIQUE_ID)
        expect(document.NetAmtPay).toBe(500)
    })

    it('refuses drafts', () => {
        expect(() => buildEisDocuments(makeInvoice(pharmaLines, { status: 'draft' }), context)).toThrow()
    })
})

describe('getEisDocumentProblems', () => {
    it('catches the checks BIR performs', () => {
        const [{ document }] = buildEisDocuments(makeInvoice([pharmaLines[2]]), context)
        expect(getEisDocumentProblems({ ...document, VATAmt: 5 }, ACCREDITATION).join(' ')).toContain('ERR004')
        expect(getEisDocumentProblems({ ...document, IssueDtm: '20201111' }, ACCREDITATION).join(' ')).toContain(
            'ERR002',
        )
        expect(getEisDocumentProblems(document, '20000002').join(' ')).toContain('ERR006')
        expect(getEisDocumentProblems({ ...document, PrevUniqueId: NO_PREVIOUS_UNIQUE_ID }).join(' ')).toContain(
            'ERR007',
        )
    })
})

describe('allocate', () => {
    it('gives the rounding remainder to the last share', () => {
        expect(allocate(10, [1, 1, 1])).toEqual([3.33, 3.33, 3.34])
        expect(allocate(0, [1, 2])).toEqual([0, 0])
    })
})
