'use client'

import { useSWRSeries } from '@/services/series'
import { useSeriesStore } from '@/stores/SeriesStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Loads the invoice series into SeriesStore. */
export default function SeriesSWRProvider({ children }: ProviderProps) {
    useSyncResource(useSeriesStore, useSWRSeries())
    return <>{children}</>
}
