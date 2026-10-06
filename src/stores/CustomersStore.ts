'use client'

import { createCollectionStore } from '@/stores/createCollectionStore'
import type { Customer } from '@/@types/customers/Customer'

export interface CustomersFilter {
    active?: boolean
}

/** Customer list (paged, searchable). */
export const useCustomersStore = createCollectionStore<Customer, CustomersFilter>({ active: true })
