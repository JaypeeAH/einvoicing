import type { Metadata } from 'next'
import AuditLogsSWRProvider from '@/components/audit/AuditLogsSWRProvider'
import AuditTrailClientPage from '@/components/settings/audit-trail/AuditTrailClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_AUDIT_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Audit Trail' }

export default async function AuditTrailPage() {
    if (!(await canAccessPage(ACTION_AUDIT_VIEW))) return <Forbidden />
    return (
        <AuditLogsSWRProvider>
            <AuditTrailClientPage />
        </AuditLogsSWRProvider>
    )
}
