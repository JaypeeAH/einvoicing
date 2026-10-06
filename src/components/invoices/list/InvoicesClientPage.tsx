'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Segment from '@/components/ui/Segment'
import Dropdown from '@/components/ui/Dropdown'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable'
import DebounceInput from '@/components/shared/DebounceInput'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import { useInvoicesStore } from '@/stores/InvoicesStore'
import useAuthority from '@/utils/hooks/useAuthority'
import { formatDateOnly } from '@/utils/date'
import { formatPeso } from '@/utils/money'
import { INVOICE_STATUS_OPTIONS, TRANSMISSION_STATUS_OPTIONS } from '@/@types/invoices/InvoiceStatusOptions'
import { ACTION_INVOICE_ISSUE, ACTION_MEMO_ISSUE } from '@/constants/actions.constant'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, type DocumentType, type InvoiceStatus } from '@/constants/bir.constant'
import { getInvoicePath, newInvoicePath } from '@/configs/app.config'
import { AddIcon, ExpandIcon, InvoicesNavIcon, SearchIcon } from '@/configs/icons.config'
import type { Invoice } from '@/@types/invoices/Invoice'
import type { Option } from '@/@types/common'

const TYPE_OPTIONS: Option<DocumentType | ''>[] = [
    { value: '', label: 'All document types' },
    ...DOCUMENT_TYPES.map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] })),
]

interface InvoicesClientPageProps {
    /** Search text from the header search box (`?query=`). */
    initialQuery?: string
}

/** Invoices & memos: search, filter and open documents; start a new invoice. */
export default function InvoicesClientPage({ initialQuery }: InvoicesClientPageProps) {
    const router = useRouter()
    const { records, total, page, size, query, filter, loading, error } = useInvoicesStore()
    const { setPage, setQuery, setFilter } = useInvoicesStore()
    const canIssue = useAuthority(ACTION_INVOICE_ISSUE)
    const canIssueMemo = useAuthority(ACTION_MEMO_ISSUE)

    useEffect(() => {
        if (initialQuery !== undefined) useInvoicesStore.getState().setQuery(initialQuery)
    }, [initialQuery])

    const columns: DataTableColumn<Invoice>[] = [
        {
            key: 'number',
            header: 'Number',
            cell: (row) =>
                row.invoiceNumber ? (
                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {row.invoiceNumber}
                    </span>
                ) : (
                    <span className="text-gray-400 italic">Not yet issued</span>
                ),
        },
        { key: 'type', header: 'Type', cell: (row) => DOCUMENT_TYPE_LABELS[row.documentType], hideBelow: 'md' },
        { key: 'date', header: 'Date', cell: (row) => formatDateOnly(row.invoiceDate) },
        {
            key: 'customer',
            header: 'Customer',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="truncate">{row.buyerName}</div>
                    {row.buyerTin && <div className="text-xs text-gray-500">TIN {row.buyerTin}</div>}
                </div>
            ),
            hideBelow: 'sm',
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            cell: (row) => (
                <span className={row.documentType === 'credit_memo' ? 'text-error' : undefined}>
                    {row.documentType === 'credit_memo' ? '−' : ''}
                    {formatPeso(row.totalAmount)}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    <StatusBadge option={INVOICE_STATUS_OPTIONS[row.status]} />
                    {row.transmissionStatus && (
                        <span className="hidden lg:inline-flex">
                            <StatusBadge option={TRANSMISSION_STATUS_OPTIONS[row.transmissionStatus]} />
                        </span>
                    )}
                </div>
            ),
        },
    ]

    const newButton = canIssue && (
        <Dropdown
            placement="bottom-end"
            renderTitle={
                <Button size="sm" variant="solid" icon={<AddIcon />}>
                    <span className="flex items-center gap-1">
                        New <ExpandIcon />
                    </span>
                </Button>
            }
        >
            <Dropdown.Item eventKey="sales_invoice" onClick={() => router.push(`${newInvoicePath}?type=sales_invoice`)}>
                Sales invoice
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="service_invoice"
                onClick={() => router.push(`${newInvoicePath}?type=service_invoice`)}
            >
                Service invoice
            </Dropdown.Item>
            {canIssueMemo && (
                <>
                    <Dropdown.Item variant="divider" />
                    <Dropdown.Item
                        eventKey="credit_memo"
                        onClick={() => router.push(`${newInvoicePath}?type=credit_memo`)}
                    >
                        Credit memo
                    </Dropdown.Item>
                    <Dropdown.Item
                        eventKey="debit_memo"
                        onClick={() => router.push(`${newInvoicePath}?type=debit_memo`)}
                    >
                        Debit memo
                    </Dropdown.Item>
                </>
            )}
        </Dropdown>
    )

    return (
        <>
            <PageHeader
                title="Invoices & Memos"
                description="Every sales invoice, service invoice, credit memo and debit memo, in serial-number order per branch."
                actions={newButton}
            />
            <Card>
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <DebounceInput
                        className="lg:max-w-xs"
                        size="sm"
                        prefix={<SearchIcon className="text-lg" />}
                        placeholder="Number, customer or TIN"
                        value={query}
                        onChange={setQuery}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <Segment
                            size="sm"
                            value={filter.status ?? 'all'}
                            onChange={(value) =>
                                setFilter({ status: value === 'all' ? undefined : (value as InvoiceStatus) })
                            }
                        >
                            <Segment.Item value="all">All</Segment.Item>
                            <Segment.Item value="draft">Drafts</Segment.Item>
                            <Segment.Item value="issued">Issued</Segment.Item>
                            <Segment.Item value="voided">Voided</Segment.Item>
                        </Segment>
                        <div className="sm:w-48">
                            <Select<Option<DocumentType | ''>>
                                size="sm"
                                options={TYPE_OPTIONS}
                                value={TYPE_OPTIONS.find((option) => option.value === (filter.documentType ?? ''))}
                                onChange={(option) => setFilter({ documentType: option?.value || undefined })}
                                isSearchable={false}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                size="sm"
                                type="date"
                                aria-label="From date"
                                value={filter.dateFrom ?? ''}
                                onChange={(e) => setFilter({ dateFrom: e.target.value || undefined })}
                            />
                            <span className="text-gray-400">to</span>
                            <Input
                                size="sm"
                                type="date"
                                aria-label="To date"
                                value={filter.dateTo ?? ''}
                                onChange={(e) => setFilter({ dateTo: e.target.value || undefined })}
                            />
                        </div>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    records={records}
                    rowKey={(row) => row.id}
                    loading={loading}
                    error={error}
                    onRowClick={(row) => router.push(getInvoicePath(row.id))}
                    paging={{ page, size, total, onChange: setPage }}
                    empty={
                        <EmptyState
                            icon={<InvoicesNavIcon />}
                            title={
                                query || filter.status || filter.documentType
                                    ? 'No documents match your filters'
                                    : 'No invoices yet'
                            }
                            description="Create your first invoice — it stays a draft until you issue it."
                            action={
                                canIssue && (
                                    <Link
                                        href={`${newInvoicePath}?type=sales_invoice`}
                                        className="font-semibold text-primary hover:underline"
                                    >
                                        Create an invoice
                                    </Link>
                                )
                            }
                        />
                    }
                />
            </Card>
        </>
    )
}
