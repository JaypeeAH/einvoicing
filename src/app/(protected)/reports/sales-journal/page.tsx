import type { Metadata } from 'next'
import BranchesSWRProvider from '@/components/branches/BranchesSWRProvider'
import SalesJournalSWRProvider from '@/components/reports/SalesJournalSWRProvider'
import SalesJournalClientPage from '@/components/reports/SalesJournalClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_REPORT_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Sales Journal' }

export default async function SalesJournalPage() {
    if (!(await canAccessPage(ACTION_REPORT_VIEW))) return <Forbidden />
    return (
        <BranchesSWRProvider>
            <SalesJournalSWRProvider>
                <SalesJournalClientPage />
            </SalesJournalSWRProvider>
        </BranchesSWRProvider>
    )
}
