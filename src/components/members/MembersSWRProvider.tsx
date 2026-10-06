'use client'

import { useSWRMembers } from '@/services/members'
import { useMembersStore } from '@/stores/MembersStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Loads the organization members into MembersStore. */
export default function MembersSWRProvider({ children }: ProviderProps) {
    useSyncResource(useMembersStore, useSWRMembers())
    return <>{children}</>
}
