import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import type { AuditLog } from '@/@types/audit/AuditLog'
import type { Collection } from '@/@types/collections'
import { toSearchPattern } from '@/server/routes/api'

interface AuditLogRow {
    id: number
    organization_id: string
    user_id: string | null
    user_email: string | null
    action: AuditLog['action']
    entity_type: string
    entity_id: string | null
    summary: string
    changes: Record<string, unknown> | null
    created_at: string
}

const toAuditLog = (row: AuditLogRow): AuditLog => ({
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    userEmail: row.user_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    changes: row.action === 'update' ? (row.changes as AuditLog['changes']) : null,
    createdAt: row.created_at,
})

export const listAuditLogs = async (
    supabase: ServerSupabase,
    organizationId: string,
    params: { query?: string; entityType?: string; dateFrom?: string; dateTo?: string; from: number; to: number },
): Promise<Collection<AuditLog>> => {
    let request = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(params.from, params.to)
    if (params.entityType) request = request.eq('entity_type', params.entityType)
    if (params.dateFrom) request = request.gte('created_at', `${params.dateFrom}T00:00:00+08:00`)
    if (params.dateTo) request = request.lte('created_at', `${params.dateTo}T23:59:59.999+08:00`)
    if (params.query) {
        const pattern = toSearchPattern(params.query)
        request = request.or(`summary.ilike.${pattern},user_email.ilike.${pattern}`)
    }
    const { data, error, count } = await request.returns<AuditLogRow[]>()
    if (error) throw error
    return { total: count ?? 0, records: data.map(toAuditLog) }
}

/** Records an event that is not a row change (exports, downloads). */
export const logAuditEvent = async (
    supabase: ServerSupabase,
    organizationId: string,
    event: { action: string; entityType: string; entityId?: string | null; summary: string },
) => {
    const { error } = await supabase.rpc('log_audit_event', {
        p_organization_id: organizationId,
        p_action: event.action,
        p_entity_type: event.entityType,
        p_entity_id: event.entityId ?? null,
        p_summary: event.summary,
    })
    if (error) throw error
}
