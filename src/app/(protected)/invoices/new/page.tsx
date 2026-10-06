import type { Metadata } from 'next'
import OrganizationSWRProvider from '@/components/organization/OrganizationSWRProvider'
import BranchesSWRProvider from '@/components/branches/BranchesSWRProvider'
import SeriesSWRProvider from '@/components/series/SeriesSWRProvider'
import NewInvoiceClientPage from '@/components/invoices/NewInvoiceClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_INVOICE_ISSUE, ACTION_MEMO_ISSUE } from '@/constants/actions.constant'
import { DOCUMENT_TYPES, isMemoDocumentType, type DocumentType } from '@/constants/bir.constant'

export const metadata: Metadata = { title: 'New invoice' }

export default async function NewInvoicePage({ searchParams }: PageProps<'/invoices/new'>) {
    const params = await searchParams
    const type = typeof params.type === 'string' ? params.type : ''
    const documentType: DocumentType = (DOCUMENT_TYPES as readonly string[]).includes(type)
        ? (type as DocumentType)
        : 'sales_invoice'
    const referenceId = typeof params.reference === 'string' ? params.reference : null

    const allowed = isMemoDocumentType(documentType)
        ? await canAccessPage(ACTION_MEMO_ISSUE)
        : await canAccessPage(ACTION_INVOICE_ISSUE)
    if (!allowed) return <Forbidden />

    return (
        <OrganizationSWRProvider>
            <BranchesSWRProvider>
                <SeriesSWRProvider>
                    <NewInvoiceClientPage
                        key={`${documentType}-${referenceId}`}
                        documentType={documentType}
                        referenceId={referenceId}
                    />
                </SeriesSWRProvider>
            </BranchesSWRProvider>
        </OrganizationSWRProvider>
    )
}
