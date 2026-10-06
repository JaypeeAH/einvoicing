'use client'

import { useSWRTransmissions } from '@/services/transmissions'
import { useTransmissionsStore } from '@/stores/TransmissionsStore'
import { useSyncCollection } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Fetches the EIS transmission queue and syncs it into TransmissionsStore (refreshes every minute). */
export default function TransmissionsSWRProvider({ children }: ProviderProps) {
    const page = useTransmissionsStore((state) => state.page)
    const size = useTransmissionsStore((state) => state.size)
    const filter = useTransmissionsStore((state) => state.filter)

    useSyncCollection(
        useTransmissionsStore,
        useSWRTransmissions({ page, size, ...filter }, { refreshInterval: 60_000 }),
    )

    return <>{children}</>
}
