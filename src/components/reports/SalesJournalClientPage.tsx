'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import Alert from '@/components/ui/Alert'
import { toastError } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Loading from '@/components/shared/Loading'
import ReportHeaderBlock from '@/components/reports/ReportHeaderBlock'
import { useSalesJournalParamsStore, useSalesJournalStore } from '@/stores/SalesJournalStore'
import { useBranchesStore } from '@/stores/BranchesStore'
import { apiExportSalesJournal } from '@/services/reports'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { formatDateOnly } from '@/utils/date'
import { formatAmount } from '@/utils/money'
import classNames from '@/utils/classNames'
import { DOCUMENT_TYPE_LABELS } from '@/constants/bir.constant'
import { DownloadIcon, PrintIcon, SalesJournalNavIcon } from '@/configs/icons.config'
import type { SalesAmounts, SalesJournalRow } from '@/@types/reports/SalesJournal'
import type { Option } from '@/@types/common'

const AMOUNT_COLUMNS: { key: keyof SalesAmounts; label: string }[] = [
    { key: 'grossAmount', label: 'Gross' },
    { key: 'discountAmount', label: 'Discount' },
    { key: 'vatableSales', label: 'VATable' },
    { key: 'vatAmount', label: 'VAT' },
    { key: 'zeroRatedSales', label: 'Zero-rated' },
    { key: 'vatExemptSales', label: 'Exempt' },
    { key: 'nonVatSales', label: 'Non-VAT' },
    { key: 'totalAmount', label: 'Total' },
]

const ALL_BRANCHES: Option = { value: '', label: 'All branches' }

/** Sales Journal (RR 9-2009 book of accounts) for a date range and branch, with CSV export and print. */
export default function SalesJournalClientPage() {
    useSetBreadcrumbs([{ label: 'Reports' }, { label: 'Sales Journal' }])

    const { data: journal, loading, validating, error } = useSalesJournalStore()
    const params = useSalesJournalParamsStore((state) => state.params)
    const setParams = useSalesJournalParamsStore((state) => state.setParams)
    const branches = useBranchesStore((state) => state.data)
    const [exporting, setExporting] = useState(false)

    const rangeInvalid = !params.from || !params.to || params.from > params.to

    const branchOptions: Option[] = [
        ALL_BRANCHES,
        ...(branches ?? []).map((branch) => ({ value: branch.id, label: `${branch.code} — ${branch.name}` })),
    ]

    const onExport = async () => {
        setExporting(true)
        try {
            await apiExportSalesJournal(params)
        } catch (error) {
            toastError('Could not export the Sales Journal.', error)
        } finally {
            setExporting(false)
        }
    }

    return (
        <>
            <PageHeader
                title="Sales Journal"
                description="Every issued and voided invoice and memo for the period, in the column format BIR expects for your books of accounts."
                actions={
                    <>
                        <Button size="sm" icon={<PrintIcon />} onClick={() => window.print()} disabled={!journal}>
                            Print
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<DownloadIcon />}
                            loading={exporting}
                            disabled={rangeInvalid}
                            onClick={onExport}
                        >
                            Export CSV
                        </Button>
                    </>
                }
            />

            <Card className="mb-4 print:hidden">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">From</span>
                        <Input
                            size="sm"
                            type="date"
                            value={params.from}
                            invalid={rangeInvalid}
                            onChange={(e) => setParams({ from: e.target.value })}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">To</span>
                        <Input
                            size="sm"
                            type="date"
                            value={params.to}
                            invalid={rangeInvalid}
                            onChange={(e) => setParams({ to: e.target.value })}
                        />
                    </label>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Branch</span>
                        <Select<Option>
                            size="sm"
                            options={branchOptions}
                            value={
                                branchOptions.find((option) => option.value === (params.branchId ?? '')) ?? ALL_BRANCHES
                            }
                            onChange={(option) => setParams({ branchId: option?.value || undefined })}
                            isSearchable={false}
                        />
                    </div>
                </div>
                {rangeInvalid && (
                    <p className="mt-2 text-sm text-error">Choose a start date that is on or before the end date.</p>
                )}
            </Card>

            <Card className="relative print:border-0 print:shadow-none" bodyClass="print:p-0">
                {error && (
                    <Alert type="danger" showIcon className="mb-4" duration={0}>
                        {error}
                    </Alert>
                )}
                <Loading loading={loading && !journal} type="default">
                    {journal && (
                        <div className={classNames(validating && 'opacity-60')}>
                            <ReportHeaderBlock
                                title="Sales Journal"
                                period={`Period: ${formatDateOnly(journal.from)} to ${formatDateOnly(journal.to)}`}
                                header={journal.header}
                            />
                            {journal.rows.length === 0 ? (
                                <EmptyState
                                    icon={<SalesJournalNavIcon />}
                                    title="No invoices in this period"
                                    description="Issued and voided invoices and memos dated within the period will be listed here."
                                />
                            ) : (
                                <SalesJournalTable rows={journal.rows} totals={journal.totals} />
                            )}
                        </div>
                    )}
                </Loading>
            </Card>
        </>
    )
}

interface SalesJournalTableProps {
    rows: SalesJournalRow[]
    totals: SalesAmounts
}

/** The journal rows with a totals footer. Voided documents are greyed out and listed with zero amounts. */
function SalesJournalTable({ rows, totals }: SalesJournalTableProps) {
    return (
        <Table compact hoverable={false} className="text-sm print:text-[10px]">
            <Table.THead>
                <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Doc. No.</Table.Th>
                    <Table.Th>Customer TIN</Table.Th>
                    <Table.Th>Customer</Table.Th>
                    <Table.Th>Description</Table.Th>
                    {AMOUNT_COLUMNS.map((column) => (
                        <Table.Th key={column.key} className="text-right">
                            {column.label}
                        </Table.Th>
                    ))}
                </Table.Tr>
            </Table.THead>
            <Table.TBody>
                {rows.map((row) => {
                    const voided = row.status === 'voided'
                    return (
                        <Table.Tr key={row.id} className={classNames(voided && 'text-gray-400 dark:text-gray-500')}>
                            <Table.Td className="whitespace-nowrap">{formatDateOnly(row.invoiceDate)}</Table.Td>
                            <Table.Td className="whitespace-nowrap">
                                <div className={classNames('font-semibold', voided && 'line-through')}>
                                    {row.invoiceNumber}
                                </div>
                                <div className="text-xs text-gray-500">{DOCUMENT_TYPE_LABELS[row.documentType]}</div>
                                {voided && (
                                    <Tag className="mt-1 border-0 bg-error-subtle text-xs text-error">VOIDED</Tag>
                                )}
                            </Table.Td>
                            <Table.Td className="whitespace-nowrap">{row.buyerTin || '—'}</Table.Td>
                            <Table.Td className="min-w-40">{row.buyerName}</Table.Td>
                            <Table.Td className="min-w-48">{row.description}</Table.Td>
                            {AMOUNT_COLUMNS.map((column) => (
                                <Table.Td key={column.key} className="text-right whitespace-nowrap tabular-nums">
                                    {formatAmount(row[column.key])}
                                </Table.Td>
                            ))}
                        </Table.Tr>
                    )
                })}
            </Table.TBody>
            <Table.TFoot>
                <Table.Tr className="border-t-2 border-gray-300 font-bold text-gray-900 dark:border-gray-600 dark:text-gray-100">
                    <Table.Td colSpan={5}>Total ({rows.length} documents)</Table.Td>
                    {AMOUNT_COLUMNS.map((column) => (
                        <Table.Td key={column.key} className="text-right whitespace-nowrap tabular-nums">
                            {formatAmount(totals[column.key])}
                        </Table.Td>
                    ))}
                </Table.Tr>
            </Table.TFoot>
        </Table>
    )
}
