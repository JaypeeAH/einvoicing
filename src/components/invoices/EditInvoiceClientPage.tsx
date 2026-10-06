'use client'

import Link from 'next/link'
import Alert from '@/components/ui/Alert'
import Loading from '@/components/shared/Loading'
import InvoiceEditor from '@/components/invoices/forms/InvoiceEditor'
import { useBranchesStore } from '@/stores/BranchesStore'
import { useSeriesStore } from '@/stores/SeriesStore'
import { useSWRInvoice } from '@/services/invoices'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { toInvoiceFormData } from '@/utils/invoices/invoiceFormData'
import { tryGetErrorMessage } from '@/utils/errors'
import { getInvoicePath, invoicesPath } from '@/configs/app.config'

/** Edits a draft. Issued documents are immutable, so they redirect back to their details. */
export default function EditInvoiceClientPage({ invoiceId }: { invoiceId: string }) {
    const { data: invoice, error } = useSWRInvoice(invoiceId, { revalidateOnFocus: false })
    const branches = useBranchesStore((state) => state.data)
    const seriesLoading = useSeriesStore((state) => state.loading)

    useSetBreadcrumbs([
        { label: 'Invoices & Memos', href: invoicesPath },
        { label: 'Draft', href: getInvoicePath(invoiceId) },
        { label: 'Edit' },
    ])

    if (error) {
        return (
            <Alert type="danger" showIcon duration={0}>
                {tryGetErrorMessage(error)}
            </Alert>
        )
    }
    if (!invoice || !branches || seriesLoading) return <Loading loading type="default" />

    if (invoice.status !== 'draft') {
        return (
            <Alert type="info" showIcon duration={0}>
                This document has been issued and can no longer be edited.{' '}
                <Link href={getInvoicePath(invoice.id)} className="underline">
                    View it
                </Link>
            </Alert>
        )
    }

    return (
        <InvoiceEditor
            invoiceId={invoice.id}
            defaultValues={toInvoiceFormData(invoice)}
            initialReference={invoice.referenceInvoice ? { ...invoice.referenceInvoice } : null}
            initialCustomer={invoice.customerId ? { id: invoice.customerId, registeredName: invoice.buyer.name } : null}
        />
    )
}
