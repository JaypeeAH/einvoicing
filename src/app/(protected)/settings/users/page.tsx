import type { Metadata } from 'next'
import MembersSWRProvider from '@/components/members/MembersSWRProvider'
import UsersClientPage from '@/components/settings/users/UsersClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_USER_MANAGE } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Users & Roles' }

export default async function UsersPage() {
    if (!(await canAccessPage(ACTION_USER_MANAGE))) return <Forbidden />
    return (
        <MembersSWRProvider>
            <UsersClientPage />
        </MembersSWRProvider>
    )
}
