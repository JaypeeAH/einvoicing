'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'
import Loading from '@/components/shared/Loading'
import StatusBadge from '@/components/shared/StatusBadge'
import InvoiceDocument from '@/components/invoices/details/InvoiceDocument'
import InvoiceActions from '@/components/invoices/details/InvoiceActions'
import { useInvoiceStore } from '@/stores/InvoiceStore'
import { useOrganizationStore } from '@/stores/OrganizationStore'
import { useBranchesStore } from '@/stores/BranchesStore'
import { useSeriesStore } from '@/stores/SeriesStore'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { findActiveSeries, getDraftSeller } from '@/utils/invoices/invoiceFormData'
import { formatDateOnly, formatDateTime } from '@/utils/date'
import { formatPeso } from '@/utils/money'
import { INVOICE_STATUS_OPTIONS, TRANSMISSION_STATUS_OPTIONS } from '@/@types/invoices/InvoiceStatusOptions'
import { DOCUMENT_TYPE_LABELS } from '@/constants/bir.constant'
import { getInvoicePath, invoicesPath, seriesPath, transmissionsPath } from '@/configs/app.config'
import type { ReactNode } from 'react'

const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex justify-between gap-4 py-1.5">
        <span className="text-gray-500">{label}</span>
        <span className="text-right font-semibold text-gray-900 dark:text-gray-100">{children}</span>
    </div>
)

/** One document: the BIR-format invoice, its status history, EIS transmission and adjustments. */
export default function InvoiceDetailsClientPage() {
    const invoice = useInvoiceStore((state) => state.data)
    const error = useInvoiceStore((state) => state.error)
    const refresh = useInvoiceStore((state) => state.refresh)
    const setData = useInvoiceStore((state) => state.setData)
    const organization = useOrganizationStore((state) => state.data)
    const branches = useBranchesStore((state) => state.data)
    const series = useSeriesStore((state) => state.data)

    const title = invoice
        ? `${DOCUMENT_TYPE_LABELS[invoice.documentType]} ${invoice.invoiceNumber ?? '(draft)'}`
        : 'Document'
    useSetBreadcrumbs([{ label: 'Invoices & Memos', href: invoicesPath }, { label: title }])

    if (error && !invoice) {
        return (
            <Alert type="danger" showIcon duration={0}>
                {error}
            </Alert>
        )
    }
    if (!invoice) return <Loading loading type="default" />

    const activeSeries = findActiveSeries(series, invoice.branchId, invoice.documentType)
    const draftSeller =
        invoice.status === 'draft'
            ? getDraftSeller(
                  organization,
                  branches?.find((branch) => branch.id === invoice.branchId),
                  activeSeries,
              )
            : null

    return (
        <>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="heading-text">{title}</h3>
                        <StatusBadge option={INVOICE_STATUS_OPTIONS[invoice.status]} />
                        {invoice.transmissionStatus && (
                            <StatusBadge option={TRANSMISSION_STATUS_OPTIONS[invoice.transmissionStatus]} />
                        )}
                    </div>
                    <p className="mt-1 text-gray-500">
                        {invoice.buyerName} · {formatDateOnly(invoice.invoiceDate)} · {formatPeso(invoice.totalAmount)}
                    </p>
                </div>
                <InvoiceActions
                    invoice={invoice}
                    hasActiveSeries={!!activeSeries}
                    onChanged={(updated) => {
                        if (updated) setData(updated)
                        refresh()
                    }}
                />
            </div>

            {invoice.status === 'draft' && !activeSeries && (
                <Alert type="warning" showIcon className="mb-4" duration={0}>
                    This draft cannot be issued until branch {invoice.branchCode} has an active{' '}
                    {DOCUMENT_TYPE_LABELS[invoice.documentType].toLowerCase()} series.{' '}
                    <Link href={seriesPath} className="font-semibold underline">
                        Set up invoice series
                    </Link>
                </Alert>
            )}
            {invoice.status === 'voided' && (
                <Alert type="danger" showIcon className="mb-4" duration={0} title="Voided">
                    {invoice.voidReason} — {invoice.voidedByName ?? 'unknown user'}, {formatDateTime(invoice.voidedAt)}
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <Card bodyClass="p-0 overflow-x-auto">
                    <InvoiceDocument invoice={invoice} draftSeller={draftSeller} className="rounded-2xl" />
                </Card>

                <div className="flex flex-col gap-4">
                    <Card header={{ content: 'Details' }}>
                        <Detail label="Branch">{invoice.branchCode}</Detail>
                        <Detail label="Created by">{invoice.createdByName ?? '—'}</Detail>
                        <Detail label="Created">{formatDateTime(invoice.createdAt)}</Detail>
                        {invoice.issuedAt && (
                            <>
                                <Detail label="Issued by">{invoice.issuedByName ?? '—'}</Detail>
                                <Detail label="Issued">{formatDateTime(invoice.issuedAt)}</Detail>
                            </>
                        )}
                        {invoice.status !== 'draft' && <Detail label="Printed copies">{invoice.printCount}</Detail>}
                        {invoice.integrityHash && (
                            <div className="pt-2">
                                <div className="text-gray-500">Integrity hash (SHA-256)</div>
                                <div className="mt-1 font-mono text-[11px] break-all text-gray-700 dark:text-gray-300">
                                    {invoice.integrityHash}
                                </div>
                            </div>
                        )}
                    </Card>

                    {invoice.transmissionStatus && (
                        <Card header={{ content: 'BIR EIS transmission' }}>
                            <div className="flex items-center justify-between">
                                <StatusBadge option={TRANSMISSION_STATUS_OPTIONS[invoice.transmissionStatus]} />
                                <Link
                                    href={transmissionsPath}
                                    className="text-sm font-semibold text-primary hover:underline"
                                >
                                    View queue
                                </Link>
                            </div>
                        </Card>
                    )}

                    {invoice.referenceInvoice && (
                        <Card header={{ content: 'Adjusts' }}>
                            <Link
                                href={getInvoicePath(invoice.referenceInvoice.id)}
                                className="font-semibold text-primary hover:underline"
                            >
                                {DOCUMENT_TYPE_LABELS[invoice.referenceInvoice.documentType]}{' '}
                                {invoice.referenceInvoice.invoiceNumber}
                            </Link>
                            <div className="text-gray-500">
                                {formatDateOnly(invoice.referenceInvoice.invoiceDate)} ·{' '}
                                {formatPeso(invoice.referenceInvoice.totalAmount)}
                            </div>
                        </Card>
                    )}

                    {invoice.adjustments.length > 0 && (
                        <Card header={{ content: 'Credit & debit memos' }}>
                            <ul className="space-y-2">
                                {invoice.adjustments.map((memo) => (
                                    <li key={memo.id} className="flex justify-between gap-2">
                                        <Link
                                            href={getInvoicePath(memo.id)}
                                            className="font-semibold text-primary hover:underline"
                                        >
                                            {DOCUMENT_TYPE_LABELS[memo.documentType]} {memo.invoiceNumber}
                                        </Link>
                                        <span
                                            className={memo.documentType === 'credit_memo' ? 'text-error' : undefined}
                                        >
                                            {memo.documentType === 'credit_memo' ? '−' : '+'}
                                            {formatPeso(memo.totalAmount)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            </div>
        </>
    )
}
