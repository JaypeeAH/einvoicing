'use client'

import { useSWRAuditLogs } from '@/services/audit'
import { useAuditLogsStore } from '@/stores/AuditLogsStore'
import { useSyncCollection } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Fetches the audit trail page and syncs it into AuditLogsStore. */
export default function AuditLogsSWRProvider({ children }: ProviderProps) {
    const page = useAuditLogsStore((state) => state.page)
    const size = useAuditLogsStore((state) => state.size)
    const query = useAuditLogsStore((state) => state.query)
    const filter = useAuditLogsStore((state) => state.filter)

    useSyncCollection(useAuditLogsStore, useSWRAuditLogs({ page, size, query, ...filter }))

    return <>{children}</>
}
