'use client'

import { useSWRInvoices } from '@/services/invoices'
import { useInvoicesStore } from '@/stores/InvoicesStore'
import { useSyncCollection } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Fetches the invoice page for the store's paging/search/filter and syncs it into InvoicesStore. */
export default function InvoicesSWRProvider({ children }: ProviderProps) {
    const page = useInvoicesStore((state) => state.page)
    const size = useInvoicesStore((state) => state.size)
    const query = useInvoicesStore((state) => state.query)
    const filter = useInvoicesStore((state) => state.filter)

    useSyncCollection(useInvoicesStore, useSWRInvoices({ page, size, query, ...filter }))

    return <>{children}</>
}
