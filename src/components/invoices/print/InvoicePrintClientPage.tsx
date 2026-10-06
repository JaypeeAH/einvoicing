'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { toastError } from '@/components/ui/toast/toast'
import Loading from '@/components/shared/Loading'
import InvoiceDocument from '@/components/invoices/details/InvoiceDocument'
import { useInvoiceStore } from '@/stores/InvoiceStore'
import { useOrganizationStore } from '@/stores/OrganizationStore'
import { useBranchesStore } from '@/stores/BranchesStore'
import { useSeriesStore } from '@/stores/SeriesStore'
import { apiRecordInvoicePrint } from '@/services/invoices'
import { findActiveSeries, getDraftSeller } from '@/utils/invoices/invoiceFormData'
import { getInvoicePath } from '@/configs/app.config'
import { BackIcon, PrintIcon } from '@/configs/icons.config'

/**
 * Printable invoice. Each print of an issued document is counted: the first copy is marked ORIGINAL and
 * later copies REPRINT (RMC 5-2021 Annex B). Use the browser's "Save as PDF" for a PDF copy.
 */
export default function InvoicePrintClientPage() {
    const invoice = useInvoiceStore((state) => state.data)
    const error = useInvoiceStore((state) => state.error)
    const organization = useOrganizationStore((state) => state.data)
    const branches = useBranchesStore((state) => state.data)
    const series = useSeriesStore((state) => state.data)
    const [copy, setCopy] = useState<number | null>(null)
    const [printing, setPrinting] = useState(false)

    if (error && !invoice) {
        return (
            <Alert type="danger" showIcon duration={0} className="mx-auto max-w-3xl">
                {error}
            </Alert>
        )
    }
    if (!invoice) return <Loading loading type="default" />

    const isDraft = invoice.status === 'draft'
    const copyNumber = copy ?? invoice.printCount + 1
    const copyLabel = isDraft ? null : copyNumber <= 1 ? 'ORIGINAL' : 'REPRINT'

    const print = async () => {
        setPrinting(true)
        try {
            if (!isDraft) {
                const result = await apiRecordInvoicePrint(invoice.id)
                setCopy(result.copy)
            }
            // Let React render the ORIGINAL/REPRINT label before the print dialog opens
            setTimeout(() => {
                window.print()
                setPrinting(false)
            }, 50)
        } catch (error) {
            setPrinting(false)
            toastError('Could not record the print. Please try again.', error)
        }
    }

    const draftSeller = isDraft
        ? getDraftSeller(
              organization,
              branches?.find((branch) => branch.id === invoice.branchId),
              findActiveSeries(series, invoice.branchId, invoice.documentType),
          )
        : null

    return (
        <div className="mx-auto max-w-[900px] px-4 print:max-w-none print:px-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
                <Link href={getInvoicePath(invoice.id)} className="flex items-center gap-1 font-semibold text-primary">
                    <BackIcon /> Back to document
                </Link>
                <div className="flex items-center gap-3">
                    {!isDraft && (
                        <span className="text-sm text-gray-500">
                            This will print as <strong>{copyLabel}</strong>
                        </span>
                    )}
                    <Button size="sm" variant="solid" icon={<PrintIcon />} loading={printing} onClick={print}>
                        Print / Save as PDF
                    </Button>
                </div>
            </div>
            <div className="rounded-2xl shadow-sm print:rounded-none print:shadow-none">
                <InvoiceDocument
                    invoice={invoice}
                    draftSeller={draftSeller}
                    copyLabel={copyLabel}
                    className="rounded-2xl print:rounded-none"
                />
            </div>
        </div>
    )
}
