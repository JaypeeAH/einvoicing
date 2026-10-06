import type { Metadata } from 'next'
import ComplianceSWRProvider from '@/components/compliance/ComplianceSWRProvider'
import ComplianceClientPage from '@/components/compliance/ComplianceClientPage'
import OrganizationSWRProvider from '@/components/organization/OrganizationSWRProvider'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_COMPLIANCE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Compliance Center' }

export default async function CompliancePage() {
    if (!(await canAccessPage(ACTION_COMPLIANCE_VIEW))) return <Forbidden />
    return (
        <OrganizationSWRProvider>
            <ComplianceSWRProvider>
                <ComplianceClientPage />
            </ComplianceSWRProvider>
        </OrganizationSWRProvider>
    )
}
