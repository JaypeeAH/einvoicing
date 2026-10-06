'use client'

import dayjs from 'dayjs'
import { create } from 'zustand'
import { createResourceStore } from '@/stores/createResourceStore'
import { currentQuarter, todayInManila } from '@/utils/date'
import type { SummaryListOfSales } from '@/@types/reports/SummaryListOfSales'
import type { SummaryListOfSalesParams } from '@/services/reports'

interface SummaryListOfSalesParamsStore {
    params: SummaryListOfSalesParams
    setParams: (params: Partial<SummaryListOfSalesParams>) => void
}

/** Summary List of Sales report data (filled by SummaryListOfSalesSWRProvider). */
export const useSummaryListOfSalesStore = createResourceStore<SummaryListOfSales>()

/** Year and quarter the Summary List of Sales is generated for (defaults to the current quarter). */
export const useSummaryListOfSalesParamsStore = create<SummaryListOfSalesParamsStore>((set) => ({
    params: { year: dayjs(todayInManila()).year(), quarter: currentQuarter() },
    setParams: (params) => set((state) => ({ params: { ...state.params, ...params } })),
}))
