import type { Metadata } from 'next'
import TransmissionsSWRProvider from '@/components/transmissions/TransmissionsSWRProvider'
import TransmissionsClientPage from '@/components/transmissions/TransmissionsClientPage'
import OrganizationSWRProvider from '@/components/organization/OrganizationSWRProvider'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_COMPLIANCE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'EIS Transmissions' }

export default async function TransmissionsPage() {
    if (!(await canAccessPage(ACTION_COMPLIANCE_VIEW))) return <Forbidden />
    return (
        <OrganizationSWRProvider>
            <TransmissionsSWRProvider>
                <TransmissionsClientPage />
            </TransmissionsSWRProvider>
        </OrganizationSWRProvider>
    )
}
