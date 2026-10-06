'use client'

import { useSWROrganization } from '@/services/organization'
import { useOrganizationStore } from '@/stores/OrganizationStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Loads the current organization into OrganizationStore. */
export default function OrganizationSWRProvider({ children }: ProviderProps) {
    useSyncResource(useOrganizationStore, useSWROrganization())
    return <>{children}</>
}
