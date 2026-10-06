import type { Metadata } from 'next'
import CustomersSWRProvider from '@/components/customers/CustomersSWRProvider'
import CustomersClientPage from '@/components/customers/CustomersClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Customers' }

export default async function CustomersPage() {
    if (!(await canAccessPage(ACTION_INVOICE_VIEW))) return <Forbidden />
    return (
        <CustomersSWRProvider>
            <CustomersClientPage />
        </CustomersSWRProvider>
    )
}
