import type { Metadata } from 'next'
import SummaryListOfSalesSWRProvider from '@/components/reports/SummaryListOfSalesSWRProvider'
import SummaryListOfSalesClientPage from '@/components/reports/SummaryListOfSalesClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_REPORT_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Summary List of Sales' }

export default async function SummaryListOfSalesPage() {
    if (!(await canAccessPage(ACTION_REPORT_VIEW))) return <Forbidden />
    return (
        <SummaryListOfSalesSWRProvider>
            <SummaryListOfSalesClientPage />
        </SummaryListOfSalesSWRProvider>
    )
}
