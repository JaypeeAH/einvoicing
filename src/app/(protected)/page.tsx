import type { Metadata } from 'next'
import DashboardSWRProvider from '@/components/dashboard/DashboardSWRProvider'
import DashboardClientPage from '@/components/dashboard/DashboardClientPage'
import ComplianceSWRProvider from '@/components/compliance/ComplianceSWRProvider'
import { requireMember } from '@/server/auth/guards'
import { hasAnyAuthority } from '@/utils/hasAuthority'
import { ACTION_COMPLIANCE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Dashboard' }

/** Home page for every member. Compliance reminders are loaded only for roles that can view compliance. */
export default async function DashboardPage() {
    const user = await requireMember()
    const showCompliance = hasAnyAuthority(user.role, [ACTION_COMPLIANCE_VIEW])

    const content = (
        <DashboardSWRProvider>
            <DashboardClientPage showCompliance={showCompliance} />
        </DashboardSWRProvider>
    )

    return showCompliance ? <ComplianceSWRProvider>{content}</ComplianceSWRProvider> : content
}
