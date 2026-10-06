import 'server-only'

/**
 * Invoice data sent to the BIR Electronic Invoicing System. BIR prescribes JSON built from the minimum
 * invoice information plus discounts and withholding (RMC 98-2026 Sec. IV.6). This is our canonical
 * shape; `BirEisProvider` maps it to the exact property names of the EIS API specification that BIR gives
 * the taxpayer during EIS certification.
 */
export interface EisInvoicePayload {
    documentType: string
    invoiceNumber: string
    invoiceDate: string
    issuedAt: string
    currency: 'PHP'
    seller: {
        tin: string
        branchCode: string
        registeredName: string
        businessName: string | null
        address: string
        vatRegistration: 'vat' | 'non_vat'
        acNumber: string | null
        ptiNumber: string | null
    }
    buyer: {
        name: string | null
        tin: string | null
        branchCode: string | null
        address: string | null
    }
    lines: {
        lineNumber: number
        description: string
        quantity: number
        unit: string
        unitPrice: number
        discount: number
        specialDiscount: number
        taxTreatment: string
        netAmount: number
        vatAmount: number
        totalAmount: number
    }[]
    totals: {
        vatableSales: number
        vatAmount: number
        zeroRatedSales: number
        vatExemptSales: number
        nonVatSales: number
        discount: number
        specialDiscount: number
        withholdingTax: number
        totalAmount: number
    }
    specialDiscount: { type: string; idNumber: string; holderName: string } | null
    reference: { invoiceNumber: string | null; invoiceDate: string; reason: string | null } | null
    manualInvoiceReference: string | null
    integrityHash: string | null
}

export interface EisTransmitResult {
    status: 'accepted' | 'rejected' | 'failed'
    birReference: string | null
    responseCode: string | null
    responseMessage: string
}

export interface EisProvider {
    readonly name: string
    transmit(payload: EisInvoicePayload): Promise<EisTransmitResult>
}
