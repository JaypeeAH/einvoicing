'use client'

import { useSWRRegistrations } from '@/services/registrations'
import { useRegistrationsStore } from '@/stores/RegistrationsStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Loads BIR registrations into RegistrationsStore. */
export default function RegistrationsSWRProvider({ children }: ProviderProps) {
    useSyncResource(useRegistrationsStore, useSWRRegistrations())
    return <>{children}</>
}
