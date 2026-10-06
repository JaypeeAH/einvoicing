'use client'

import { create } from 'zustand'

/** Shape of a store holding one fetched resource (organization, branch list, compliance status, ...). */
export interface ResourceStore<T> {
    data: T | undefined
    loading: boolean
    validating: boolean
    error: string | null
    refresh: () => void
    setData: (data: T | undefined) => void
    setStatus: (status: { loading: boolean; validating: boolean; error: string | null }) => void
    setRefresh: (refresh: () => void) => void
}

/** Creates a resource store filled by an `*SWRProvider` (SWR → Zustand bridge). */
export const createResourceStore = <T>() =>
    create<ResourceStore<T>>((set) => ({
        data: undefined,
        loading: true,
        validating: false,
        error: null,
        refresh: () => {},
        setData: (data) => set({ data }),
        setStatus: (status) => set(status),
        setRefresh: (refresh) => set({ refresh }),
    }))
