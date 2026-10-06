'use client'

import { useSWRDashboardSummary } from '@/services/reports'
import { useDashboardStore } from '@/stores/DashboardStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Loads the dashboard summary into DashboardStore. */
export default function DashboardSWRProvider({ children }: ProviderProps) {
    useSyncResource(useDashboardStore, useSWRDashboardSummary())
    return <>{children}</>
}
