/** An append-only audit trail entry written by database triggers (RMC 5-2021 audit-trail requirement). */
export interface AuditLog {
    id: number
    organizationId: string
    userId: string | null
    userEmail: string | null
    action: 'insert' | 'update' | 'delete' | 'issue' | 'void' | 'print' | 'download' | 'export'
    entityType: string
    entityId: string | null
    summary: string
    changes: Record<string, { from: unknown; to: unknown }> | null
    createdAt: string
}
