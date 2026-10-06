'use client'

import { createCollectionStore } from '@/stores/createCollectionStore'
import type { AuditLog } from '@/@types/audit/AuditLog'

export interface AuditLogsFilter {
    entityType?: string
    dateFrom?: string
    dateTo?: string
}

/** Audit trail (newest first). */
export const useAuditLogsStore = createCollectionStore<AuditLog, AuditLogsFilter>({}, 50)
