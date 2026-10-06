import {
    SPECIAL_DISCOUNTS,
    VAT_RATE,
    type SpecialDiscountType,
    type TaxTreatment,
    type VatRegistration,
} from '@/constants/bir.constant'
import type { InvoiceTotals } from '@/@types/invoices/InvoiceTotals'
import { roundMoney, sumMoney } from '@/utils/money'

export interface CalculateLineInput {
    quantity: number
    unitPrice: number
    discountAmount?: number
    taxTreatment: TaxTreatment
    specialDiscount?: boolean
}

export interface CalculatedLine {
    taxTreatment: TaxTreatment
    grossAmount: number
    discountAmount: number
    specialDiscountAmount: number
    netAmount: number
    vatAmount: number
    totalAmount: number
}

export interface CalculateInvoiceInput {
    lines: CalculateLineInput[]
    pricesIncludeVat: boolean
    sellerVatRegistration: VatRegistration
    specialDiscountType?: SpecialDiscountType | null
    withholdingTaxRate?: number
}

/**
 * A non-VAT seller cannot charge VAT, so VATable/zero-rated lines become sales subject to percentage tax.
 * A VAT seller's "non-VAT" line is treated as VATable.
 */
export const getEffectiveTaxTreatment = (treatment: TaxTreatment, seller: VatRegistration): TaxTreatment => {
    if (seller === 'non_vat') {
        return treatment === 'vat_exempt' ? 'vat_exempt' : 'non_vat'
    }
    return treatment === 'non_vat' ? 'vatable' : treatment
}

/**
 * Computes one line. All amounts are rounded half-up to centavos.
 *
 * - VATable lines with VAT-inclusive prices: VAT = total − total ÷ 1.12, so net + VAT always equals the
 *   amount the customer pays.
 * - Statutory special discounts (senior citizen, PWD, solo parent, ...) are computed on the VAT-exclusive
 *   price and make the line VAT-exempt (RA 9994 / RA 10754 and their implementing rules).
 */
export const calculateLine = (
    line: CalculateLineInput,
    options: Pick<CalculateInvoiceInput, 'pricesIncludeVat' | 'sellerVatRegistration' | 'specialDiscountType'>,
): CalculatedLine => {
    const quantity = Number(line.quantity) || 0
    const unitPrice = Number(line.unitPrice) || 0
    const grossAmount = roundMoney(quantity * unitPrice)
    const discountAmount = roundMoney(Math.min(Math.max(Number(line.discountAmount) || 0, 0), grossAmount))
    const afterDiscount = roundMoney(grossAmount - discountAmount)

    const treatment = getEffectiveTaxTreatment(line.taxTreatment, options.sellerVatRegistration)
    const pricesIncludeVat = options.pricesIncludeVat && treatment === 'vatable'

    const special =
        line.specialDiscount && options.specialDiscountType ? SPECIAL_DISCOUNTS[options.specialDiscountType] : null

    if (special) {
        const base = pricesIncludeVat ? roundMoney(afterDiscount / (1 + VAT_RATE)) : afterDiscount
        const specialDiscountAmount = roundMoney(base * special.rate)
        const netAmount = roundMoney(base - specialDiscountAmount)
        return {
            taxTreatment: treatment === 'vatable' ? 'vat_exempt' : treatment,
            grossAmount,
            discountAmount,
            specialDiscountAmount,
            netAmount,
            vatAmount: 0,
            totalAmount: netAmount,
        }
    }

    if (treatment === 'vatable') {
        if (pricesIncludeVat) {
            const netAmount = roundMoney(afterDiscount / (1 + VAT_RATE))
            return {
                taxTreatment: treatment,
                grossAmount,
                discountAmount,
                specialDiscountAmount: 0,
                netAmount,
                vatAmount: roundMoney(afterDiscount - netAmount),
                totalAmount: afterDiscount,
            }
        }
        const vatAmount = roundMoney(afterDiscount * VAT_RATE)
        return {
            taxTreatment: treatment,
            grossAmount,
            discountAmount,
            specialDiscountAmount: 0,
            netAmount: afterDiscount,
            vatAmount,
            totalAmount: roundMoney(afterDiscount + vatAmount),
        }
    }

    return {
        taxTreatment: treatment,
        grossAmount,
        discountAmount,
        specialDiscountAmount: 0,
        netAmount: afterDiscount,
        vatAmount: 0,
        totalAmount: afterDiscount,
    }
}

/** Totals with the VAT breakdown printed on the invoice. */
export const calculateTotals = (lines: CalculatedLine[], withholdingTaxRate = 0): InvoiceTotals => {
    const by = (treatment: TaxTreatment) =>
        sumMoney(lines.filter((line) => line.taxTreatment === treatment).map((line) => line.netAmount))

    const totalAmount = sumMoney(lines.map((line) => line.totalAmount))
    // Creditable withholding tax is computed on the amount excluding VAT
    const withholdingTaxAmount = roundMoney(sumMoney(lines.map((line) => line.netAmount)) * (withholdingTaxRate || 0))

    return {
        grossAmount: sumMoney(lines.map((line) => line.grossAmount)),
        discountAmount: sumMoney(lines.map((line) => line.discountAmount)),
        specialDiscountAmount: sumMoney(lines.map((line) => line.specialDiscountAmount)),
        vatableSales: by('vatable'),
        vatAmount: sumMoney(lines.map((line) => line.vatAmount)),
        zeroRatedSales: by('zero_rated'),
        vatExemptSales: by('vat_exempt'),
        nonVatSales: by('non_vat'),
        totalAmount,
        withholdingTaxAmount,
        amountDue: roundMoney(totalAmount - withholdingTaxAmount),
    }
}

/** Calculates every line and the invoice totals. The server always recalculates; client values are a preview. */
export const calculateInvoice = (input: CalculateInvoiceInput) => {
    const lines = input.lines.map((line) => calculateLine(line, input))
    return { lines, totals: calculateTotals(lines, input.withholdingTaxRate) }
}
