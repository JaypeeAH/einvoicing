'use client'

import { useSWRCustomers } from '@/services/customers'
import { useCustomersStore } from '@/stores/CustomersStore'
import { useSyncCollection } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Fetches the customer page for the store's paging/search/filter and syncs it into CustomersStore. */
export default function CustomersSWRProvider({ children }: ProviderProps) {
    const page = useCustomersStore((state) => state.page)
    const size = useCustomersStore((state) => state.size)
    const query = useCustomersStore((state) => state.query)
    const filter = useCustomersStore((state) => state.filter)

    useSyncCollection(useCustomersStore, useSWRCustomers({ page, size, query, ...filter }))

    return <>{children}</>
}
