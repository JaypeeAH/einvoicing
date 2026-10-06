import type { Metadata } from 'next'
import BranchesSWRProvider from '@/components/branches/BranchesSWRProvider'
import BranchesClientPage from '@/components/settings/branches/BranchesClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Branches' }

export default async function BranchesPage() {
    if (!(await canAccessPage(ACTION_SETTINGS_MANAGE))) return <Forbidden />
    return (
        <BranchesSWRProvider>
            <BranchesClientPage />
        </BranchesSWRProvider>
    )
}
