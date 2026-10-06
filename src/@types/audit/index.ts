import type { PageParams } from '@/@types/collections'

export interface AuditLogsParams extends PageParams {
    entityType?: string
    dateFrom?: string
    dateTo?: string
}

export const getAuditLogsSearchParams = (params: AuditLogsParams) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
    })
    const value = search.toString()
    return value ? `?${value}` : ''
}
