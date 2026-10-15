import 'server-only'

import { SPECIAL_DISCOUNTS, VAT_RATE, type EisCorrectionCode, type TaxTreatment } from '@/constants/bir.constant'
import { roundMoney, sumMoney } from '@/utils/money'
import type { InvoiceDetails } from '@/@types/invoices/InvoiceDetails'
import type { InvoiceLine } from '@/@types/invoices/InvoiceLine'
import type { EisCasInvoice, EisItem, EisTransClass } from './types'

// Maps an issued document to BIR's CAS e-invoice JSON (EIS e-invoice JSON File Format v2.1). See
// docs/bir-eis/03-json-format-and-mapping.md for the field-by-field mapping and the open questions.

/** `PrevUniqueId` when the original document has no e-invoice unique ID in this system (field 8(a)). */
export const NO_PREVIOUS_UNIQUE_ID = '000000000000000000000000'

/** Upper limit of `ItemList` per e-invoice. */
export const EIS_MAX_ITEMS = 1000

/**
 * VAT-exempt sales and sales of non-VAT sellers both go out as 03. Sales of a non-VAT seller are not VATable
 * and the format has no separate class for them; confirm with BIR during certification.
 */
export const toTransClass = (treatment: TaxTreatment): EisTransClass => {
    switch (treatment) {
        case 'vatable':
            return '01'
        case 'zero_rated':
            return '02'
        default:
            return '03'
    }
}

const digits = (value: string | null | undefined) => (value ?? '').replace(/\D/g, '')
const text = (value: string | null | undefined, max: number) => (value ?? '').trim().slice(0, max)

/** The tax classifications present on a document, in BIR's order. */
export const getTransClasses = (invoice: Pick<InvoiceDetails, 'lines'>): EisTransClass[] =>
    [...new Set(invoice.lines.map((line) => toTransClass(line.taxTreatment)))].sort()

/**
 * Line amounts as the EIS expects them: net of VAT, regular discount per item, statutory (SC/PWD/...)
 * discounts at document level. Our lines keep the price basis the user entered, so the VAT-exclusive
 * figures are derived from the stored net amount, which is authoritative.
 */
export const toEisItem = (line: InvoiceLine, pricesIncludeVat: boolean): EisItem => {
    const netBeforeStatutory = roundMoney(line.netAmount + line.specialDiscountAmount)
    const afterDiscount = roundMoney(line.grossAmount - line.discountAmount)
    const removesVat = pricesIncludeVat && (line.taxTreatment === 'vatable' || line.specialDiscount)
    const factor = afterDiscount > 0 ? netBeforeStatutory / afterDiscount : removesVat ? 1 / (1 + VAT_RATE) : 1
    const salesAmount = roundMoney(line.grossAmount * factor)
    const quantity = roundMoney(line.quantity)
    return {
        Nm: text(line.description, 100),
        Desc: text(line.description, 100),
        Qty: quantity,
        Unit: text(line.unit, 50),
        UnitCost: roundMoney(salesAmount / (line.quantity || 1)),
        SalesAmt: salesAmount,
        RegDscntAmt: roundMoney(salesAmount - netBeforeStatutory),
        SpeDscntAmt: 0,
        NetSales: netBeforeStatutory,
    }
}

/** Splits `total` over `weights` in proportion, giving the rounding remainder to the last share. */
export const allocate = (total: number, weights: number[]) => {
    const sum = weights.reduce((acc, weight) => acc + weight, 0)
    if (!total || !sum) return weights.map(() => 0)
    const shares = weights.map((weight) => roundMoney((total * weight) / sum))
    shares[shares.length - 1] = roundMoney(total - sumMoney(shares.slice(0, -1)))
    return shares
}

const negate = (value: number) => (value === 0 ? 0 : -value)

/** Credit memos reduce sales, so every amount except the quantity is negative (format annex, CM examples). */
const toNegative = (document: EisCasInvoice): EisCasInvoice => ({
    ...document,
    ItemList: document.ItemList.map((item) => ({
        ...item,
        UnitCost: negate(item.UnitCost),
        SalesAmt: negate(item.SalesAmt),
        RegDscntAmt: negate(item.RegDscntAmt),
        SpeDscntAmt: negate(item.SpeDscntAmt),
        NetSales: negate(item.NetSales),
    })),
    TotNetItemSales: negate(document.TotNetItemSales),
    Discount: {
        ...document.Discount,
        ScAmt: negate(document.Discount.ScAmt),
        PwdAmt: negate(document.Discount.PwdAmt),
        RegAmt: negate(document.Discount.RegAmt),
        SpeAmt: negate(document.Discount.SpeAmt),
    },
    OtherTaxRev: negate(document.OtherTaxRev),
    TotNetSalesAftDisct: negate(document.TotNetSalesAftDisct),
    VATAmt: negate(document.VATAmt),
    WithholdIncome: negate(document.WithholdIncome),
    WithholdBusVAT: negate(document.WithholdBusVAT),
    WithholdBusPT: negate(document.WithholdBusPT),
    OtherNonTaxCharge: negate(document.OtherNonTaxCharge),
    NetAmtPay: negate(document.NetAmtPay),
})

export interface BuildEisDocumentsContext {
    /** Seller e-mail (optional field; the organization's e-mail). */
    sellerEmail: string | null
    /** The e-invoice unique ID to use for each tax classification (kept across retries). */
    uniqueIdFor: (transClass: EisTransClass) => string
    /** Memos: the original document's e-invoice unique IDs by classification. */
    referenceUniqueIds?: Partial<Record<EisTransClass, string>>
}

/**
 * Builds the e-invoices for one issued document: one per tax classification (API guide chapter 5 — mixed
 * invoices are transmitted separately, all with the same `CompInvoiceId`).
 */
export const buildEisDocuments = (invoice: InvoiceDetails, context: BuildEisDocumentsContext) => {
    const seller = invoice.seller
    if (!seller || !invoice.invoiceNumber || invoice.status === 'draft') {
        throw new Error('Only issued documents can be transmitted.')
    }

    const isMemo = invoice.documentType === 'credit_memo' || invoice.documentType === 'debit_memo'
    const classes = getTransClasses(invoice)
    const groups = classes.map((transClass) => ({
        transClass,
        lines: invoice.lines.filter((line) => toTransClass(line.taxTreatment) === transClass),
    }))
    for (const group of groups) {
        if (group.lines.length > EIS_MAX_ITEMS) {
            throw new Error(`The EIS accepts up to ${EIS_MAX_ITEMS} lines per tax classification.`)
        }
    }

    const withholding = allocate(
        invoice.withholdingTaxAmount,
        groups.map((group) => sumMoney(group.lines.map((line) => line.netAmount))),
    )

    const referenceIds = Object.values(context.referenceUniqueIds ?? {})
    const statutoryType = invoice.specialDiscount?.type ?? null

    const buyerName = text(invoice.buyer.name || invoice.buyer.businessName || 'Walk-in customer', 200)

    return groups.map((group, index) => {
        const items = group.lines.map((line) => toEisItem(line, invoice.pricesIncludeVat))
        const totalNetItemSales = sumMoney(items.map((item) => item.NetSales))
        const statutory = sumMoney(group.lines.map((line) => line.specialDiscountAmount))
        const discount = {
            ScAmt: statutoryType === 'senior_citizen' ? statutory : 0,
            PwdAmt: statutoryType === 'pwd' ? statutory : 0,
            RegAmt: 0,
            SpeAmt: statutoryType && statutoryType !== 'senior_citizen' && statutoryType !== 'pwd' ? statutory : 0,
            Rmk2: statutory > 0 && statutoryType ? text(`${SPECIAL_DISCOUNTS[statutoryType].label} discount`, 500) : '',
        }
        const netAfterDiscount = roundMoney(
            totalNetItemSales - discount.ScAmt - discount.PwdAmt - discount.RegAmt - discount.SpeAmt,
        )
        const vatAmount = sumMoney(group.lines.map((line) => line.vatAmount))

        let correctionCode = ''
        let previousUniqueId = ''
        let remarks = invoice.manualInvoiceReference ? `Replaces manual invoice ${invoice.manualInvoiceReference}` : ''
        if (isMemo) {
            correctionCode =
                (invoice.correctionCode as EisCorrectionCode | null) ??
                (invoice.documentType === 'debit_memo' ? '03' : '09')
            previousUniqueId =
                context.referenceUniqueIds?.[group.transClass] ?? referenceIds[0] ?? NO_PREVIOUS_UNIQUE_ID
            // Field 8(c): the other IDs of a multi-part original go in Remarks1
            const otherIds = referenceIds.filter((id) => id !== previousUniqueId)
            remarks = [
                invoice.referenceInvoice?.invoiceNumber,
                invoice.adjustmentReason,
                otherIds.length ? `Also adjusts ${otherIds.join(', ')}` : null,
            ]
                .filter(Boolean)
                .join(' — ')
        }

        const document: EisCasInvoice = {
            CompInvoiceId: text(invoice.invoiceNumber, 50),
            IssueDtm: invoice.invoiceDate.replace(/-/g, ''),
            EisUniqueId: context.uniqueIdFor(group.transClass),
            // v2.1 removed debit memos: an additional charge is reported as an invoice that corrects the original
            DocType: invoice.documentType === 'credit_memo' ? '03' : '01',
            TransClass: group.transClass,
            CorrYN: isMemo ? 'Y' : 'N',
            CorrectionCd: correctionCode,
            PrevUniqueId: previousUniqueId,
            Rmk1: text(remarks, 500),
            SellerInfo: {
                Tin: digits(seller.tin),
                BranchCd: digits(seller.branchCode).padStart(5, '0'),
                Type: seller.vatRegistration === 'vat' ? '0' : '1',
                RegNm: text(seller.registeredName, 200),
                BusinessNm: text(seller.businessName || seller.registeredName, 200),
                Email: text(context.sellerEmail, 100),
                RegAddr: text(seller.address, 300),
            },
            BuyerInfo: {
                Tin: digits(invoice.buyer.tin) || '000000000',
                BranchCd: digits(invoice.buyer.branchCode).padStart(5, '0'),
                RegNm: buyerName,
                BusinessNm: text(invoice.buyer.businessName, 200) || buyerName,
                Email: text(invoice.buyer.email, 100),
                RegAddr: text(invoice.buyer.address, 300),
                DevAddr: '',
                AirNum: '',
                AirNumDt: '',
                LadNum: '',
                LadNumDt: '',
            },
            ItemList: items,
            TotNetItemSales: totalNetItemSales,
            Discount: discount,
            OtherTaxRev: 0,
            TotNetSalesAftDisct: netAfterDiscount,
            VATAmt: vatAmount,
            WithholdIncome: withholding[index],
            WithholdBusVAT: 0,
            WithholdBusPT: 0,
            OtherNonTaxCharge: 0,
            NetAmtPay: roundMoney(netAfterDiscount + vatAmount - withholding[index]),
            PtuNum: text(seller.acNumber || seller.ptiNumber, 50),
        }

        return {
            transClass: group.transClass,
            document: invoice.documentType === 'credit_memo' ? toNegative(document) : document,
        }
    })
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.015

/**
 * Checks an e-invoice against the format's mandatory fields, formulas and the EIS verification codes
 * (SYN004, ERR002, ERR004, ERR006, ERR007) before it is sent. Used by the simulation and before every real transmission.
 */
export const getEisDocumentProblems = (document: EisCasInvoice, accreditationId?: string) => {
    const problems: string[] = []
    if (!document.CompInvoiceId) problems.push('CompInvoiceId is required.')
    if (!/^\d{8}$/.test(document.IssueDtm)) problems.push('IssueDtm must be YYYYMMDD.')
    if (!/^[0-9A-Za-z]{24}$/.test(document.EisUniqueId)) problems.push('EisUniqueId must be 24 characters.')
    else if (!document.EisUniqueId.startsWith(document.IssueDtm)) {
        problems.push('ERR002: the date in EisUniqueId differs from IssueDtm.')
    } else if (accreditationId && document.EisUniqueId.slice(8, 16) !== accreditationId) {
        problems.push('ERR006: the EIS Cert Number in EisUniqueId differs from the transmitting system.')
    }
    if (!/^\d{9}$/.test(document.SellerInfo.Tin)) problems.push('Seller TIN must be 9 digits.')
    if (!/^\d{5}$/.test(document.SellerInfo.BranchCd)) problems.push('Seller branch code must be 5 digits.')
    if (!document.SellerInfo.RegNm) problems.push('Seller registered name is required.')
    if (!document.SellerInfo.RegAddr) problems.push('Seller registered address is required.')
    if (!/^\d{9}$/.test(document.BuyerInfo.Tin)) problems.push('Buyer TIN must be 9 digits (000000000 if none).')
    if (!/^\d{5}$/.test(document.BuyerInfo.BranchCd)) problems.push('Buyer branch code must be 5 digits.')
    if (!document.BuyerInfo.RegNm) problems.push('Buyer registered name is required.')
    if (!document.PtuNum) problems.push('PtuNum (CAS acknowledgment / permit number) is required.')
    if (document.CorrYN === 'Y' && (!document.CorrectionCd || !document.PrevUniqueId)) {
        problems.push('Corrections need CorrectionCd and PrevUniqueId.')
    }
    if (document.CorrYN === 'N' && document.PrevUniqueId) problems.push('ERR007: PrevUniqueId on a regular invoice.')
    if (document.ItemList.length < 1 || document.ItemList.length > EIS_MAX_ITEMS) {
        problems.push(`ItemList must have 1 to ${EIS_MAX_ITEMS} items.`)
    }
    document.ItemList.forEach((item, index) => {
        if (!item.Nm || !item.Desc) problems.push(`Item ${index + 1}: name and description are required.`)
        if (!near(item.SalesAmt - item.RegDscntAmt - item.SpeDscntAmt, item.NetSales)) {
            problems.push(`Item ${index + 1}: NetSales must equal SalesAmt − discounts.`)
        }
    })
    if (!near(sumMoney(document.ItemList.map((item) => item.NetSales)), document.TotNetItemSales)) {
        problems.push('TotNetItemSales must equal the sum of NetSales.')
    }
    const { ScAmt, PwdAmt, RegAmt, SpeAmt } = document.Discount
    if (
        !near(
            document.TotNetItemSales + document.OtherTaxRev - ScAmt - PwdAmt - RegAmt - SpeAmt,
            document.TotNetSalesAftDisct,
        )
    ) {
        problems.push('TotNetSalesAftDisct must equal TotNetItemSales + OtherTaxRev − discounts.')
    }
    if (document.TransClass !== '01' && document.VATAmt !== 0) {
        problems.push('ERR004: VATAmt must be 0 for zero-rated and VAT-exempt e-invoices.')
    }
    if (document.VATAmt !== 0 && Math.sign(document.VATAmt) !== Math.sign(document.TotNetSalesAftDisct)) {
        problems.push('ERR004: the sales amount and VAT amount must have the same sign.')
    }
    const withheld = document.WithholdIncome + document.WithholdBusVAT + document.WithholdBusPT
    if (
        !near(
            document.TotNetSalesAftDisct + document.VATAmt - withheld + document.OtherNonTaxCharge,
            document.NetAmtPay,
        )
    ) {
        problems.push('NetAmtPay must equal net sales + VAT − withholding + non-taxable charges.')
    }
    return problems
}
