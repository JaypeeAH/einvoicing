'use client'

import { useEffect } from 'react'
import type { SWRResponse } from 'swr'
import type { StoreApi, UseBoundStore } from 'zustand'
import type { Collection } from '@/@types/collections'
import type { CollectionStore } from '@/stores/createCollectionStore'
import type { ResourceStore } from '@/stores/createResourceStore'
import { tryGetErrorMessage } from '@/utils/errors'

/** Copies an SWR result into a collection store (used by `*SWRProvider` components). */
export const useSyncCollection = <T, F extends object>(
    store: UseBoundStore<StoreApi<CollectionStore<T, F>>>,
    swr: SWRResponse<Collection<T>>,
) => {
    const { data, error, isLoading, isValidating, mutate } = swr
    useEffect(() => {
        if (data) store.getState().setRecords(data)
    }, [store, data])
    useEffect(() => {
        store.getState().setStatus({
            loading: isLoading,
            validating: isValidating,
            error: error ? tryGetErrorMessage(error) : null,
        })
    }, [store, isLoading, isValidating, error])
    useEffect(() => {
        store.getState().setRefreshPage(() => void mutate())
    }, [store, mutate])
}

/** Copies an SWR result into a resource store. */
export const useSyncResource = <T>(store: UseBoundStore<StoreApi<ResourceStore<T>>>, swr: SWRResponse<T>) => {
    const { data, error, isLoading, isValidating, mutate } = swr
    useEffect(() => {
        store.getState().setData(data)
    }, [store, data])
    useEffect(() => {
        store.getState().setStatus({
            loading: isLoading,
            validating: isValidating,
            error: error ? tryGetErrorMessage(error) : null,
        })
    }, [store, isLoading, isValidating, error])
    useEffect(() => {
        store.getState().setRefresh(() => void mutate())
    }, [store, mutate])
}
