import type { Metadata } from 'next'
import InvoicesSWRProvider from '@/components/invoices/InvoicesSWRProvider'
import InvoicesClientPage from '@/components/invoices/list/InvoicesClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Invoices & Memos' }

export default async function InvoicesPage({ searchParams }: PageProps<'/invoices'>) {
    if (!(await canAccessPage(ACTION_INVOICE_VIEW))) return <Forbidden />
    const { query } = await searchParams
    return (
        <InvoicesSWRProvider>
            <InvoicesClientPage initialQuery={typeof query === 'string' ? query : undefined} />
        </InvoicesSWRProvider>
    )
}
