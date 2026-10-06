'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import type { Breadcrumb } from '@/@types/routes'

interface BreadcrumbsStore {
    items: Breadcrumb[]
    setItems: (items: Breadcrumb[]) => void
}

/** Breadcrumbs shown above the page content by PostLoginLayout. */
const useBreadcrumbs = create<BreadcrumbsStore>((set) => ({
    items: [],
    setItems: (items) => set({ items }),
}))

/** Sets the page's breadcrumbs while it is mounted. */
export const useSetBreadcrumbs = (items: Breadcrumb[]) => {
    const setItems = useBreadcrumbs((state) => state.setItems)
    const key = JSON.stringify(items)
    useEffect(() => {
        setItems(JSON.parse(key) as Breadcrumb[])
        return () => setItems([])
    }, [key, setItems])
}

export default useBreadcrumbs
