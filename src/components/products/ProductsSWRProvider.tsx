'use client'

import { useSWRProducts } from '@/services/products'
import { useProductsStore } from '@/stores/ProductsStore'
import { useSyncCollection } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Fetches the product page for the store's paging/search/filter and syncs it into ProductsStore. */
export default function ProductsSWRProvider({ children }: ProviderProps) {
    const page = useProductsStore((state) => state.page)
    const size = useProductsStore((state) => state.size)
    const query = useProductsStore((state) => state.query)
    const filter = useProductsStore((state) => state.filter)

    useSyncCollection(useProductsStore, useSWRProducts({ page, size, query, ...filter }))

    return <>{children}</>
}
