'use client'

import { createResourceStore } from '@/stores/createResourceStore'
import type { DocumentSeries } from '@/@types/series/DocumentSeries'

/** Registered invoice series. */
export const useSeriesStore = createResourceStore<DocumentSeries[]>()
