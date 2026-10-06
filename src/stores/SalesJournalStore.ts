'use client'

import { create } from 'zustand'
import { createResourceStore } from '@/stores/createResourceStore'
import { monthRange } from '@/utils/date'
import type { SalesJournal } from '@/@types/reports/SalesJournal'
import type { SalesJournalParams } from '@/services/reports'

interface SalesJournalParamsStore {
    params: SalesJournalParams
    setParams: (params: Partial<SalesJournalParams>) => void
}

/** Sales Journal report data (filled by SalesJournalSWRProvider). */
export const useSalesJournalStore = createResourceStore<SalesJournal>()

/** Period and branch the Sales Journal is generated for (defaults to the current month, all branches). */
export const useSalesJournalParamsStore = create<SalesJournalParamsStore>((set) => ({
    params: { ...monthRange(), branchId: undefined },
    setParams: (params) => set((state) => ({ params: { ...state.params, ...params } })),
}))
