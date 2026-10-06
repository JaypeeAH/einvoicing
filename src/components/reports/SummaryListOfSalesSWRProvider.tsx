'use client'

import { useSWRSummaryListOfSales } from '@/services/reports'
import { useSummaryListOfSalesParamsStore, useSummaryListOfSalesStore } from '@/stores/SummaryListOfSalesStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Fetches the Summary List of Sales for the selected quarter and syncs it into SummaryListOfSalesStore. */
export default function SummaryListOfSalesSWRProvider({ children }: ProviderProps) {
    const params = useSummaryListOfSalesParamsStore((state) => state.params)

    useSyncResource(useSummaryListOfSalesStore, useSWRSummaryListOfSales(params))

    return <>{children}</>
}
