'use client'

import dayjs from 'dayjs'
import PageHeader from '@/components/shared/PageHeader'
import DashboardStats from '@/components/dashboard/DashboardStats'
import ActionNeededPanel from '@/components/dashboard/ActionNeededPanel'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentDocuments from '@/components/dashboard/RecentDocuments'
import { useSessionStore } from '@/stores/SessionStore'
import { BUSINESS_TIME_ZONE } from '@/utils/date'

interface DashboardClientPageProps {
    /** The user can view compliance: show checklist reminders and the e-invoicing deadline. */
    showCompliance: boolean
}

const getGreeting = () => {
    const hour = dayjs().tz(BUSINESS_TIME_ZONE).hour()
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

/** Home page: greeting, this month's figures, what needs attention, shortcuts and recent documents. */
export default function DashboardClientPage({ showCompliance }: DashboardClientPageProps) {
    const user = useSessionStore((state) => state.user)

    const firstName = user?.fullName.split(' ')[0]
    const organization = user?.organization

    return (
        <>
            <PageHeader
                title={`${getGreeting()}${firstName ? `, ${firstName}` : ''}`}
                description={
                    organization
                        ? `Here’s how ${organization.businessName || organization.registeredName} is doing this month.`
                        : 'Here’s how your business is doing this month.'
                }
            />
            <DashboardStats />
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ActionNeededPanel showCompliance={showCompliance} />
                </div>
                <QuickActions />
            </div>
            <RecentDocuments />
        </>
    )
}
