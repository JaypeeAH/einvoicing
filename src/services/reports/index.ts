import useSWR, { type SWRConfiguration } from 'swr'
import api, { saveBlob } from '@/services/api'
import type { DashboardSummary } from '@/@types/reports/DashboardSummary'
import type { SalesJournal } from '@/@types/reports/SalesJournal'
import type { SummaryListOfSales } from '@/@types/reports/SummaryListOfSales'

export interface SalesJournalParams {
    from: string
    to: string
    branchId?: string
}

export interface SummaryListOfSalesParams {
    year: number
    quarter: 1 | 2 | 3 | 4
}

const toSearch = (params: object) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
    })
    return search.toString()
}

const salesJournalUrl = (params: SalesJournalParams) => `/reports/sales-journal?${toSearch(params)}`
const summaryListOfSalesUrl = (params: SummaryListOfSalesParams) => `/reports/summary-list-of-sales?${toSearch(params)}`

/** Downloads the Sales Journal as CSV (with the BIR report header). */
export const apiExportSalesJournal = async (params: SalesJournalParams) =>
    saveBlob(await api.fetchBlob({ method: 'get', url: `${salesJournalUrl(params)}&format=csv` }))

/** Downloads the Summary List of Sales as CSV. */
export const apiExportSummaryListOfSales = async (params: SummaryListOfSalesParams) =>
    saveBlob(await api.fetchBlob({ method: 'get', url: `${summaryListOfSalesUrl(params)}&format=csv` }))

export const useSWRSalesJournal = (params: SalesJournalParams | null, config?: SWRConfiguration<SalesJournal>) =>
    useSWR(
        params ? salesJournalUrl(params) : null,
        (url: string) => api.fetchJson<SalesJournal>({ method: 'get', url }),
        {
            keepPreviousData: true,
            ...config,
        },
    )

export const useSWRSummaryListOfSales = (
    params: SummaryListOfSalesParams | null,
    config?: SWRConfiguration<SummaryListOfSales>,
) =>
    useSWR(
        params ? summaryListOfSalesUrl(params) : null,
        (url: string) => api.fetchJson<SummaryListOfSales>({ method: 'get', url }),
        { keepPreviousData: true, ...config },
    )

export const useSWRDashboardSummary = (config?: SWRConfiguration<DashboardSummary>) =>
    useSWR('/reports/dashboard', (url: string) => api.fetchJson<DashboardSummary>({ method: 'get', url }), config)
