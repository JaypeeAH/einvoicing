'use client'

import { create } from 'zustand'
import { DEFAULT_PAGE_SIZE } from '@/constants/app.constant'
import type { Collection } from '@/@types/collections'

/** Shape of every paged list store (customers, products, invoices, ...). */
export interface CollectionStore<T, F extends object> {
    page: number
    size: number
    query: string
    filter: F
    records: T[]
    total: number
    loading: boolean
    validating: boolean
    error: string | null
    /** Re-fetches the current page (wired to SWR `mutate` by the SWR provider). */
    refreshPage: () => void
    setPage: (page: number) => void
    setSize: (size: number) => void
    setQuery: (query: string) => void
    setFilter: (filter: Partial<F>) => void
    resetFilter: () => void
    setRecords: (collection: Collection<T>) => void
    setStatus: (status: { loading: boolean; validating: boolean; error: string | null }) => void
    setRefreshPage: (refreshPage: () => void) => void
}

/**
 * Creates a collection store. Data arrives through an `*SWRProvider` (SWR → Zustand bridge); components
 * read it with selectors and change paging/filters through the actions.
 */
export const createCollectionStore = <T, F extends object>(initialFilter: F, size = DEFAULT_PAGE_SIZE) =>
    create<CollectionStore<T, F>>((set) => ({
        page: 1,
        size,
        query: '',
        filter: initialFilter,
        records: [],
        total: 0,
        loading: true,
        validating: false,
        error: null,
        refreshPage: () => {},
        setPage: (page) => set({ page }),
        setSize: (size) => set({ size, page: 1 }),
        setQuery: (query) => set({ query, page: 1 }),
        setFilter: (filter) => set((state) => ({ filter: { ...state.filter, ...filter }, page: 1 })),
        resetFilter: () => set({ filter: initialFilter, query: '', page: 1 }),
        setRecords: ({ records, total }) => set({ records, total }),
        setStatus: (status) => set(status),
        setRefreshPage: (refreshPage) => set({ refreshPage }),
    }))
