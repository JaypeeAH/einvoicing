import type { Metadata } from 'next'
import BranchesSWRProvider from '@/components/branches/BranchesSWRProvider'
import SeriesSWRProvider from '@/components/series/SeriesSWRProvider'
import EditInvoiceClientPage from '@/components/invoices/EditInvoiceClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_INVOICE_ISSUE } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Edit draft' }

export default async function EditInvoicePage({ params }: PageProps<'/invoices/[id]/edit'>) {
    const { id } = await params
    if (!(await canAccessPage(ACTION_INVOICE_ISSUE))) return <Forbidden />
    return (
        <BranchesSWRProvider>
            <SeriesSWRProvider>
                <EditInvoiceClientPage invoiceId={id} />
            </SeriesSWRProvider>
        </BranchesSWRProvider>
    )
}
