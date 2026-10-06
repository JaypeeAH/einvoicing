import { describe, expect, it } from 'vitest'
import { calculateInvoice, calculateLine, getEffectiveTaxTreatment } from './calculateInvoice'

const vatSeller = { pricesIncludeVat: true, sellerVatRegistration: 'vat' as const }

describe('calculateLine', () => {
    it('splits VAT out of a VAT-inclusive price so net + VAT equals the price', () => {
        const line = calculateLine({ quantity: 1, unitPrice: 112, taxTreatment: 'vatable' }, vatSeller)
        expect(line).toMatchObject({ netAmount: 100, vatAmount: 12, totalAmount: 112 })
    })

    it('adds VAT on top of a VAT-exclusive price', () => {
        const line = calculateLine(
            { quantity: 3, unitPrice: 100, taxTreatment: 'vatable' },
            { ...vatSeller, pricesIncludeVat: false },
        )
        expect(line).toMatchObject({ grossAmount: 300, netAmount: 300, vatAmount: 36, totalAmount: 336 })
    })

    it('never lets rounding break net + VAT = total', () => {
        const line = calculateLine({ quantity: 7, unitPrice: 33.33, taxTreatment: 'vatable' }, vatSeller)
        expect(line.netAmount + line.vatAmount).toBeCloseTo(line.totalAmount, 10)
        expect(line.totalAmount).toBe(233.31)
    })

    it('applies the trade discount before VAT', () => {
        const line = calculateLine(
            { quantity: 2, unitPrice: 560, discountAmount: 112, taxTreatment: 'vatable' },
            vatSeller,
        )
        expect(line).toMatchObject({
            grossAmount: 1120,
            discountAmount: 112,
            netAmount: 900,
            vatAmount: 108,
            totalAmount: 1008,
        })
    })

    it('computes the senior citizen discount on the VAT-exclusive price and makes the sale VAT-exempt', () => {
        const line = calculateLine(
            { quantity: 1, unitPrice: 112, taxTreatment: 'vatable', specialDiscount: true },
            { ...vatSeller, specialDiscountType: 'senior_citizen' },
        )
        // 112 / 1.12 = 100; 20% discount = 20; customer pays 80, no VAT
        expect(line).toMatchObject({
            taxTreatment: 'vat_exempt',
            specialDiscountAmount: 20,
            netAmount: 80,
            vatAmount: 0,
            totalAmount: 80,
        })
    })

    it('uses the 10% solo parent rate', () => {
        const line = calculateLine(
            { quantity: 1, unitPrice: 100, taxTreatment: 'vatable', specialDiscount: true },
            { pricesIncludeVat: false, sellerVatRegistration: 'vat', specialDiscountType: 'solo_parent' },
        )
        expect(line).toMatchObject({ specialDiscountAmount: 10, netAmount: 90, totalAmount: 90 })
    })

    it('ignores the special discount flag when no cardholder discount type is set', () => {
        const line = calculateLine(
            { quantity: 1, unitPrice: 112, taxTreatment: 'vatable', specialDiscount: true },
            vatSeller,
        )
        expect(line).toMatchObject({ taxTreatment: 'vatable', specialDiscountAmount: 0, vatAmount: 12 })
    })

    it('does not charge VAT on zero-rated or exempt lines even when prices include VAT', () => {
        expect(calculateLine({ quantity: 1, unitPrice: 500, taxTreatment: 'zero_rated' }, vatSeller)).toMatchObject({
            netAmount: 500,
            vatAmount: 0,
        })
        expect(calculateLine({ quantity: 1, unitPrice: 500, taxTreatment: 'vat_exempt' }, vatSeller)).toMatchObject({
            netAmount: 500,
            vatAmount: 0,
        })
    })

    it('caps the discount at the line amount', () => {
        const line = calculateLine(
            { quantity: 1, unitPrice: 50, discountAmount: 80, taxTreatment: 'vat_exempt' },
            vatSeller,
        )
        expect(line).toMatchObject({ discountAmount: 50, totalAmount: 0 })
    })
})

describe('getEffectiveTaxTreatment', () => {
    it('turns VATable and zero-rated sales of a non-VAT seller into percentage-tax sales', () => {
        expect(getEffectiveTaxTreatment('vatable', 'non_vat')).toBe('non_vat')
        expect(getEffectiveTaxTreatment('zero_rated', 'non_vat')).toBe('non_vat')
        expect(getEffectiveTaxTreatment('vat_exempt', 'non_vat')).toBe('vat_exempt')
    })

    it('treats a VAT seller’s non-VAT line as VATable', () => {
        expect(getEffectiveTaxTreatment('non_vat', 'vat')).toBe('vatable')
    })
})

describe('calculateInvoice', () => {
    it('produces the BIR VAT breakdown for a mixed invoice', () => {
        const { totals } = calculateInvoice({
            pricesIncludeVat: true,
            sellerVatRegistration: 'vat',
            lines: [
                { quantity: 1, unitPrice: 1120, taxTreatment: 'vatable' },
                { quantity: 1, unitPrice: 300, taxTreatment: 'vat_exempt' },
                { quantity: 1, unitPrice: 200, taxTreatment: 'zero_rated' },
            ],
        })
        expect(totals).toMatchObject({
            grossAmount: 1620,
            vatableSales: 1000,
            vatAmount: 120,
            vatExemptSales: 300,
            zeroRatedSales: 200,
            nonVatSales: 0,
            totalAmount: 1620,
            amountDue: 1620,
        })
    })

    it('computes creditable withholding tax on the amount excluding VAT', () => {
        const { totals } = calculateInvoice({
            pricesIncludeVat: false,
            sellerVatRegistration: 'vat',
            withholdingTaxRate: 0.02,
            lines: [{ quantity: 10, unitPrice: 1000, taxTreatment: 'vatable' }],
        })
        expect(totals).toMatchObject({ totalAmount: 11200, withholdingTaxAmount: 200, amountDue: 11000 })
    })

    it('reports non-VAT seller sales as subject to percentage tax', () => {
        const { totals } = calculateInvoice({
            pricesIncludeVat: true,
            sellerVatRegistration: 'non_vat',
            lines: [{ quantity: 2, unitPrice: 250, taxTreatment: 'vatable' }],
        })
        expect(totals).toMatchObject({ vatableSales: 0, vatAmount: 0, nonVatSales: 500, totalAmount: 500 })
    })
})
