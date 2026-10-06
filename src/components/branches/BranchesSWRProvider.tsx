'use client'

import { useSWRBranches } from '@/services/branches'
import { useBranchesStore } from '@/stores/BranchesStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Loads the branches into BranchesStore. */
export default function BranchesSWRProvider({ children }: ProviderProps) {
    useSyncResource(useBranchesStore, useSWRBranches())
    return <>{children}</>
}
