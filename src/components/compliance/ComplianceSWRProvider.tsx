'use client'

import { useSWRComplianceStatus } from '@/services/compliance'
import { useComplianceStore } from '@/stores/ComplianceStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Loads the Compliance Center status into ComplianceStore. */
export default function ComplianceSWRProvider({ children }: ProviderProps) {
    useSyncResource(useComplianceStore, useSWRComplianceStatus())
    return <>{children}</>
}
