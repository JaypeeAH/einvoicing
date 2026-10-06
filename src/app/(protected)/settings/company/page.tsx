import type { Metadata } from 'next'
import OrganizationSWRProvider from '@/components/organization/OrganizationSWRProvider'
import CompanySettingsClientPage from '@/components/settings/company/CompanySettingsClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Company Profile' }

export default async function CompanySettingsPage() {
    if (!(await canAccessPage(ACTION_SETTINGS_MANAGE))) return <Forbidden />
    return (
        <OrganizationSWRProvider>
            <CompanySettingsClientPage />
        </OrganizationSWRProvider>
    )
}
