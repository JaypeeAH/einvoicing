'use client'

import { createResourceStore } from '@/stores/createResourceStore'
import type { DashboardSummary } from '@/@types/reports/DashboardSummary'

/** Dashboard summary figures. */
export const useDashboardStore = createResourceStore<DashboardSummary>()
