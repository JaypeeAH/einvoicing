'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import LinkButton from '@/components/ui/LinkButton'
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import { useDashboardStore } from '@/stores/DashboardStore'
import useAuthority from '@/utils/hooks/useAuthority'
import { formatDateOnly } from '@/utils/date'
import { formatPeso } from '@/utils/money'
import { getInvoicePath, invoicesPath, newInvoicePath, seriesPath } from '@/configs/app.config'
import { ACTION_INVOICE_ISSUE, ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'
import { DOCUMENT_TYPE_LABELS } from '@/constants/bir.constant'
import { INVOICE_STATUS_OPTIONS } from '@/@types/invoices/InvoiceStatusOptions'
import { AddIcon, InvoicesNavIcon, SeriesNavIcon } from '@/configs/icons.config'
import type { Invoice } from '@/@types/invoices/Invoice'

/** The latest invoices and memos (drafts included), linking to each document. */
export default function RecentDocuments() {
    const router = useRouter()
    const records = useDashboardStore((state) => state.data?.recentInvoices) ?? []
    const loading = useDashboardStore((state) => state.loading)
    const error = useDashboardStore((state) => state.error)
    const canIssue = useAuthority(ACTION_INVOICE_ISSUE)
    const canManageSettings = useAuthority(ACTION_SETTINGS_MANAGE)

    const columns: DataTableColumn<Invoice>[] = [
        {
            key: 'number',
            header: 'Document',
            cell: (row) => (
                <div className="min-w-0">
                    <Link
                        href={getInvoicePath(row.id)}
                        className="font-semibold text-gray-900 hover:text-primary dark:text-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.invoiceNumber ?? 'Draft'}
                    </Link>
                    <div className="text-xs text-gray-500">{DOCUMENT_TYPE_LABELS[row.documentType]}</div>
                </div>
            ),
        },
        { key: 'date', header: 'Date', cell: (row) => formatDateOnly(row.invoiceDate), hideBelow: 'sm' },
        { key: 'customer', header: 'Customer', cell: (row) => row.buyerName || '—', hideBelow: 'md' },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            cell: (row) => <span className="whitespace-nowrap tabular-nums">{formatPeso(row.totalAmount)}</span>,
        },
        { key: 'status', header: 'Status', cell: (row) => <StatusBadge option={INVOICE_STATUS_OPTIONS[row.status]} /> },
    ]

    return (
        <Card
            header={{
                content: 'Recent documents',
                extra: records.length > 0 && (
                    <Link href={invoicesPath} className="text-sm font-semibold text-primary hover:underline">
                        View all
                    </Link>
                ),
            }}
        >
            <DataTable
                columns={columns}
                records={records}
                rowKey={(row) => row.id}
                loading={loading}
                error={error}
                onRowClick={(row) => router.push(getInvoicePath(row.id))}
                compact
                empty={
                    <EmptyState
                        icon={<InvoicesNavIcon />}
                        title="No invoices yet"
                        description="Set up your invoice series before issuing your first invoice. Each branch needs its own registered series of serial numbers."
                        action={
                            <div className="flex flex-wrap justify-center gap-2">
                                {canManageSettings && (
                                    <LinkButton size="sm" href={seriesPath} icon={<SeriesNavIcon />}>
                                        Set up invoice series
                                    </LinkButton>
                                )}
                                {canIssue && (
                                    <LinkButton size="sm" variant="solid" href={newInvoicePath} icon={<AddIcon />}>
                                        New invoice
                                    </LinkButton>
                                )}
                            </div>
                        }
                    />
                }
            />
        </Card>
    )
}
