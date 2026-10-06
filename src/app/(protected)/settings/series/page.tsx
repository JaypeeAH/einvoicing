import type { Metadata } from 'next'
import SeriesSWRProvider from '@/components/series/SeriesSWRProvider'
import BranchesSWRProvider from '@/components/branches/BranchesSWRProvider'
import SeriesClientPage from '@/components/settings/series/SeriesClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Invoice Series' }

export default async function SeriesPage() {
    if (!(await canAccessPage(ACTION_SETTINGS_MANAGE))) return <Forbidden />
    return (
        <SeriesSWRProvider>
            <BranchesSWRProvider>
                <SeriesClientPage />
            </BranchesSWRProvider>
        </SeriesSWRProvider>
    )
}
