import type { DocumentType, TaxTreatment } from '@/constants/bir.constant'
import { formatSeriesRange } from '@/utils/invoices/invoiceNumber'
import { todayInManila } from '@/utils/date'
import type { Branch } from '@/@types/branches/Branch'
import type { InvoiceDetails, InvoiceSeller } from '@/@types/invoices/InvoiceDetails'
import type { InvoiceFormData, InvoiceLineFormData } from '@/@types/invoices/forms/InvoiceFormData'
import type { Organization } from '@/@types/organizations/Organization'
import type { DocumentSeries } from '@/@types/series/DocumentSeries'

export const emptyInvoiceLine = (taxTreatment: TaxTreatment): InvoiceLineFormData => ({
    productId: null,
    description: '',
    unit: 'pc',
    quantity: 1,
    unitPrice: 0,
    discountAmount: 0,
    taxTreatment,
    specialDiscount: false,
})

/** Defaults for a new invoice. */
export const getNewInvoiceDefaults = (input: {
    documentType: DocumentType
    branchId: string
    pricesIncludeVat: boolean
    taxTreatment: TaxTreatment
}): InvoiceFormData => ({
    documentType: input.documentType,
    branchId: input.branchId,
    invoiceDate: todayInManila(),
    dueDate: null,
    paymentTerms: '',
    customerId: null,
    buyer: { name: '', businessName: '', tin: '', branchCode: '', address: '', email: '' },
    pricesIncludeVat: input.pricesIncludeVat,
    withholdingTaxRate: 0,
    specialDiscount: null,
    referenceInvoiceId: null,
    adjustmentReason: '',
    manualInvoiceReference: '',
    notes: '',
    lines: [emptyInvoiceLine(input.taxTreatment)],
})

/** Form values of an existing draft. */
export const toInvoiceFormData = (invoice: InvoiceDetails): InvoiceFormData => ({
    documentType: invoice.documentType,
    branchId: invoice.branchId,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    paymentTerms: invoice.paymentTerms ?? '',
    customerId: invoice.customerId,
    buyer: {
        name: invoice.buyer.name,
        businessName: invoice.buyer.businessName ?? '',
        tin: invoice.buyer.tin ?? '',
        branchCode: invoice.buyer.branchCode ?? '',
        address: invoice.buyer.address ?? '',
        email: invoice.buyer.email ?? '',
    },
    pricesIncludeVat: invoice.pricesIncludeVat,
    withholdingTaxRate: invoice.withholdingTaxRate,
    specialDiscount: invoice.specialDiscount
        ? { ...invoice.specialDiscount, holderTin: invoice.specialDiscount.holderTin ?? '' }
        : null,
    referenceInvoiceId: invoice.referenceInvoice?.id ?? null,
    adjustmentReason: invoice.adjustmentReason ?? '',
    manualInvoiceReference: invoice.manualInvoiceReference ?? '',
    notes: invoice.notes ?? '',
    lines: invoice.lines.map((line) => ({
        productId: line.productId,
        description: line.description,
        unit: line.unit,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountAmount: line.discountAmount,
        taxTreatment: line.specialDiscount && line.taxTreatment === 'vat_exempt' ? 'vatable' : line.taxTreatment,
        specialDiscount: line.specialDiscount,
    })),
})

/**
 * A credit or debit memo for an issued invoice: same branch, buyer and VAT basis. A credit memo starts with
 * the invoice's lines (reduce quantities or prices to the amount being credited); a debit memo starts empty.
 */
export const getMemoDefaults = (reference: InvoiceDetails, documentType: DocumentType): InvoiceFormData => {
    const base = toInvoiceFormData(reference)
    return {
        ...base,
        documentType,
        invoiceDate: todayInManila(),
        dueDate: null,
        referenceInvoiceId: reference.id,
        adjustmentReason: '',
        manualInvoiceReference: '',
        notes: '',
        withholdingTaxRate: 0,
        lines:
            documentType === 'credit_memo'
                ? base.lines
                : [emptyInvoiceLine(reference.lines[0]?.taxTreatment === 'non_vat' ? 'non_vat' : 'vatable')],
    }
}

/** Seller block for previewing a draft (issued documents print their own snapshot). */
export const getDraftSeller = (
    organization: Organization | undefined,
    branch: Branch | undefined,
    series: DocumentSeries | undefined,
): InvoiceSeller | null =>
    organization
        ? {
              registeredName: organization.registeredName,
              businessName: organization.businessName,
              tin: organization.tin,
              branchCode: branch?.code ?? '00000',
              address: branch?.address ?? organization.registeredAddress,
              vatRegistration: organization.vatRegistration,
              acNumber: series?.acNumber ?? null,
              acDate: series?.acDate ?? null,
              seriesRange: series
                  ? formatSeriesRange(series.prefix, series.startNumber, series.endNumber, series.padding)
                  : null,
              ptiNumber: null,
          }
        : null

/** The active series that will number a document of this type at this branch. */
export const findActiveSeries = (series: DocumentSeries[] | undefined, branchId: string, documentType: DocumentType) =>
    series?.find((item) => item.isActive && item.branchId === branchId && item.documentType === documentType)
