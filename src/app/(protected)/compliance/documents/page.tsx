import type { Metadata } from 'next'
import DocumentsSWRProvider from '@/components/documents/DocumentsSWRProvider'
import DocumentsClientPage from '@/components/documents/DocumentsClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_COMPLIANCE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Compliance Documents' }

export default async function DocumentsPage() {
    if (!(await canAccessPage(ACTION_COMPLIANCE_VIEW))) return <Forbidden />
    return (
        <DocumentsSWRProvider>
            <DocumentsClientPage />
        </DocumentsSWRProvider>
    )
}
