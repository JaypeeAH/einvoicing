/** Invoice totals with the VAT breakdown required on the face of the invoice (RR 7-2024). */
export interface InvoiceTotals {
    /** Sum of quantity × unit price as entered. */
    grossAmount: number
    /** Regular (trade) discounts. */
    discountAmount: number
    /** Statutory special discounts (SC/PWD/...). */
    specialDiscountAmount: number
    vatableSales: number
    vatAmount: number
    zeroRatedSales: number
    vatExemptSales: number
    /** Non-VAT seller: sales subject to percentage tax. */
    nonVatSales: number
    /** Total amount of the sale including VAT. */
    totalAmount: number
    /** Creditable withholding tax the buyer is expected to withhold (informational). */
    withholdingTaxAmount: number
    /** totalAmount − withholdingTaxAmount */
    amountDue: number
}
