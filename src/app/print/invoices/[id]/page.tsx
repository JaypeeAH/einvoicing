import type { Metadata } from 'next'
import InvoiceSWRProvider from '@/components/invoices/InvoiceSWRProvider'
import OrganizationSWRProvider from '@/components/organization/OrganizationSWRProvider'
import BranchesSWRProvider from '@/components/branches/BranchesSWRProvider'
import SeriesSWRProvider from '@/components/series/SeriesSWRProvider'
import InvoicePrintClientPage from '@/components/invoices/print/InvoicePrintClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Print invoice' }

export default async function PrintInvoicePage({ params }: PageProps<'/print/invoices/[id]'>) {
    const { id } = await params
    if (!(await canAccessPage(ACTION_INVOICE_VIEW))) return <Forbidden />
    return (
        <InvoiceSWRProvider invoiceId={id}>
            <OrganizationSWRProvider>
                <BranchesSWRProvider>
                    <SeriesSWRProvider>
                        <InvoicePrintClientPage />
                    </SeriesSWRProvider>
                </BranchesSWRProvider>
            </OrganizationSWRProvider>
        </InvoiceSWRProvider>
    )
}
