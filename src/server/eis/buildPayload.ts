import 'server-only'

import type { InvoiceDetails } from '@/@types/invoices/InvoiceDetails'
import type { EisInvoicePayload } from './types'

/** Builds the EIS payload from an issued document (seller details come from the issue-time snapshot). */
export const buildEisPayload = (invoice: InvoiceDetails): EisInvoicePayload => {
    if (!invoice.seller || !invoice.invoiceNumber || !invoice.issuedAt) {
        throw new Error('Only issued documents can be transmitted.')
    }
    return {
        documentType: invoice.documentType,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        issuedAt: invoice.issuedAt,
        currency: 'PHP',
        seller: {
            tin: invoice.seller.tin,
            branchCode: invoice.seller.branchCode,
            registeredName: invoice.seller.registeredName,
            businessName: invoice.seller.businessName,
            address: invoice.seller.address,
            vatRegistration: invoice.seller.vatRegistration,
            acNumber: invoice.seller.acNumber,
            ptiNumber: invoice.seller.ptiNumber,
        },
        buyer: {
            name: invoice.buyer.name || null,
            tin: invoice.buyer.tin,
            branchCode: invoice.buyer.branchCode,
            address: invoice.buyer.address,
        },
        lines: invoice.lines.map((line) => ({
            lineNumber: line.lineNumber,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            discount: line.discountAmount,
            specialDiscount: line.specialDiscountAmount,
            taxTreatment: line.taxTreatment,
            netAmount: line.netAmount,
            vatAmount: line.vatAmount,
            totalAmount: line.totalAmount,
        })),
        totals: {
            vatableSales: invoice.vatableSales,
            vatAmount: invoice.vatAmount,
            zeroRatedSales: invoice.zeroRatedSales,
            vatExemptSales: invoice.vatExemptSales,
            nonVatSales: invoice.nonVatSales,
            discount: invoice.discountAmount,
            specialDiscount: invoice.specialDiscountAmount,
            withholdingTax: invoice.withholdingTaxAmount,
            totalAmount: invoice.totalAmount,
        },
        specialDiscount: invoice.specialDiscount
            ? {
                  type: invoice.specialDiscount.type,
                  idNumber: invoice.specialDiscount.idNumber,
                  holderName: invoice.specialDiscount.holderName,
              }
            : null,
        reference: invoice.referenceInvoice
            ? {
                  invoiceNumber: invoice.referenceInvoice.invoiceNumber,
                  invoiceDate: invoice.referenceInvoice.invoiceDate,
                  reason: invoice.adjustmentReason,
              }
            : null,
        manualInvoiceReference: invoice.manualInvoiceReference,
        integrityHash: invoice.integrityHash,
    }
}
