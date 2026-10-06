import type { Metadata } from 'next'
import RegistrationsSWRProvider from '@/components/registrations/RegistrationsSWRProvider'
import RegistrationsClientPage from '@/components/registrations/RegistrationsClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_COMPLIANCE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Registrations & Permits' }

export default async function RegistrationsPage() {
    if (!(await canAccessPage(ACTION_COMPLIANCE_VIEW))) return <Forbidden />
    return (
        <RegistrationsSWRProvider>
            <RegistrationsClientPage />
        </RegistrationsSWRProvider>
    )
}
