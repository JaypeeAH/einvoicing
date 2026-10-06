'use client'

import { useSWRSalesJournal } from '@/services/reports'
import { useSalesJournalParamsStore, useSalesJournalStore } from '@/stores/SalesJournalStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Fetches the Sales Journal for the selected period/branch and syncs it into SalesJournalStore. */
export default function SalesJournalSWRProvider({ children }: ProviderProps) {
    const params = useSalesJournalParamsStore((state) => state.params)
    const valid = !!params.from && !!params.to && params.from <= params.to

    useSyncResource(useSalesJournalStore, useSWRSalesJournal(valid ? params : null))

    return <>{children}</>
}
