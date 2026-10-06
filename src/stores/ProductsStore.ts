'use client'

import { createCollectionStore } from '@/stores/createCollectionStore'
import type { Product } from '@/@types/products/Product'

export interface ProductsFilter {
    active?: boolean
}

/** Products & services list (paged, searchable). */
export const useProductsStore = createCollectionStore<Product, ProductsFilter>({ active: true })
