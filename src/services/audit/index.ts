import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { getAuditLogsSearchParams, type AuditLogsParams } from '@/@types/audit'
import type { AuditLog } from '@/@types/audit/AuditLog'
import type { Collection } from '@/@types/collections'

const auditLogsPath = '/audit-logs'

export const useSWRAuditLogs = (params: AuditLogsParams | null, config?: SWRConfiguration<Collection<AuditLog>>) =>
    useSWR(
        params ? `${auditLogsPath}${getAuditLogsSearchParams(params)}` : null,
        (url: string) => api.fetchJson<Collection<AuditLog>>({ method: 'get', url }),
        { keepPreviousData: true, ...config },
    )
