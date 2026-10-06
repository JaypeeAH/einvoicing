import type { ReportHeader } from './SalesJournal'

/** Summary List of Sales row: totals per buyer for the quarter (RR 16-2005 as amended). */
export interface SummaryListOfSalesRow {
    buyerTin: string | null
    buyerName: string
    buyerAddress: string | null
    grossSales: number
    exemptSales: number
    zeroRatedSales: number
    taxableSales: number
    outputTax: number
    grossTaxableSales: number
}

export type SummaryListOfSalesAmounts = Omit<SummaryListOfSalesRow, 'buyerTin' | 'buyerName' | 'buyerAddress'>

export interface SummaryListOfSales {
    header: ReportHeader
    year: number
    quarter: 1 | 2 | 3 | 4
    rows: SummaryListOfSalesRow[]
    totals: SummaryListOfSalesAmounts
}
