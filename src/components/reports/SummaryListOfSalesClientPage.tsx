'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Segment from '@/components/ui/Segment'
import Table from '@/components/ui/Table'
import Alert from '@/components/ui/Alert'
import { toastError } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Loading from '@/components/shared/Loading'
import ReportHeaderBlock from '@/components/reports/ReportHeaderBlock'
import { useSummaryListOfSalesParamsStore, useSummaryListOfSalesStore } from '@/stores/SummaryListOfSalesStore'
import { apiExportSummaryListOfSales } from '@/services/reports'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { formatDateOnly, quarterRange, todayInManila } from '@/utils/date'
import { formatAmount } from '@/utils/money'
import classNames from '@/utils/classNames'
import { DownloadIcon, PrintIcon, SummaryListNavIcon } from '@/configs/icons.config'
import type { SummaryListOfSalesAmounts } from '@/@types/reports/SummaryListOfSales'
import type { Option } from '@/@types/common'

const AMOUNT_COLUMNS: { key: keyof SummaryListOfSalesAmounts; label: string }[] = [
    { key: 'grossSales', label: 'Gross sales' },
    { key: 'exemptSales', label: 'Exempt' },
    { key: 'zeroRatedSales', label: 'Zero-rated' },
    { key: 'taxableSales', label: 'Taxable' },
    { key: 'outputTax', label: 'Output tax' },
    { key: 'grossTaxableSales', label: 'Gross taxable' },
]

const QUARTERS = [1, 2, 3, 4] as const

const getPeriodLabel = (year: number, quarter: 1 | 2 | 3 | 4) => {
    const { from, to } = quarterRange(year, quarter)
    return `Quarter ${quarter}, ${year} (${formatDateOnly(from)} to ${formatDateOnly(to)})`
}

/** Summary List of Sales (SLSP) per buyer for a quarter, with CSV export for the RELIEF/DAT file. */
export default function SummaryListOfSalesClientPage() {
    useSetBreadcrumbs([{ label: 'Reports' }, { label: 'Summary List of Sales' }])

    const { data: report, loading, validating, error } = useSummaryListOfSalesStore()
    const params = useSummaryListOfSalesParamsStore((state) => state.params)
    const setParams = useSummaryListOfSalesParamsStore((state) => state.setParams)
    const [exporting, setExporting] = useState(false)

    const thisYear = dayjs(todayInManila()).year()
    const yearOptions: Option<number>[] = Array.from({ length: 6 }, (_, index) => thisYear - index).map((year) => ({
        value: year,
        label: String(year),
    }))

    const range = quarterRange(params.year, params.quarter)

    const onExport = async () => {
        setExporting(true)
        try {
            await apiExportSummaryListOfSales(params)
        } catch (error) {
            toastError('Could not export the Summary List of Sales.', error)
        } finally {
            setExporting(false)
        }
    }

    return (
        <>
            <PageHeader
                title="Summary List of Sales"
                description="Your sales for the quarter, totalled per buyer."
                actions={
                    <>
                        <Button size="sm" icon={<PrintIcon />} onClick={() => window.print()} disabled={!report}>
                            Print
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<DownloadIcon />}
                            loading={exporting}
                            onClick={onExport}
                        >
                            Export CSV
                        </Button>
                    </>
                }
            />

            <Alert type="info" showIcon className="mb-4 print:hidden" duration={0}>
                VAT-registered taxpayers file the SLSP quarterly by the 25th day after the quarter through BIR
                eSubmission. Use this as the source for your RELIEF/DAT file.
            </Alert>

            <Card className="mb-4 print:hidden">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex flex-col gap-1 sm:w-40">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Year</span>
                        <Select<Option<number>>
                            size="sm"
                            options={yearOptions}
                            value={
                                yearOptions.find((option) => option.value === params.year) ?? {
                                    value: params.year,
                                    label: String(params.year),
                                }
                            }
                            onChange={(option) => option && setParams({ year: option.value })}
                            isSearchable={false}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Quarter</span>
                        <Segment
                            size="sm"
                            value={String(params.quarter)}
                            onChange={(value) => {
                                const quarter = Number(value)
                                if (quarter >= 1 && quarter <= 4) setParams({ quarter: quarter as 1 | 2 | 3 | 4 })
                            }}
                        >
                            {QUARTERS.map((quarter) => (
                                <Segment.Item key={quarter} value={String(quarter)}>
                                    Q{quarter}
                                </Segment.Item>
                            ))}
                        </Segment>
                    </div>
                    <div className="text-sm text-gray-500 sm:pb-2">
                        {formatDateOnly(range.from)} to {formatDateOnly(range.to)}
                    </div>
                </div>
            </Card>

            <Card className="relative print:border-0 print:shadow-none" bodyClass="print:p-0">
                {error && (
                    <Alert type="danger" showIcon className="mb-4" duration={0}>
                        {error}
                    </Alert>
                )}
                <Loading loading={loading && !report} type="default">
                    {report && (
                        <div className={classNames(validating && 'opacity-60')}>
                            <ReportHeaderBlock
                                title="Summary List of Sales"
                                period={getPeriodLabel(report.year, report.quarter)}
                                header={report.header}
                            />
                            {report.rows.length === 0 ? (
                                <EmptyState
                                    icon={<SummaryListNavIcon />}
                                    title="No sales in this quarter"
                                    description="Issued invoices dated within the quarter will be totalled here per buyer."
                                />
                            ) : (
                                <Table compact hoverable={false} className="text-sm print:text-[10px]">
                                    <Table.THead>
                                        <Table.Tr>
                                            <Table.Th>TIN</Table.Th>
                                            <Table.Th>Buyer</Table.Th>
                                            <Table.Th>Address</Table.Th>
                                            {AMOUNT_COLUMNS.map((column) => (
                                                <Table.Th key={column.key} className="text-right">
                                                    {column.label}
                                                </Table.Th>
                                            ))}
                                        </Table.Tr>
                                    </Table.THead>
                                    <Table.TBody>
                                        {report.rows.map((row, index) => (
                                            <Table.Tr key={`${row.buyerTin ?? 'none'}-${row.buyerName}-${index}`}>
                                                <Table.Td className="whitespace-nowrap">{row.buyerTin || '—'}</Table.Td>
                                                <Table.Td className="min-w-40 font-semibold text-gray-900 dark:text-gray-100">
                                                    {row.buyerName}
                                                </Table.Td>
                                                <Table.Td className="min-w-48">{row.buyerAddress || '—'}</Table.Td>
                                                {AMOUNT_COLUMNS.map((column) => (
                                                    <Table.Td
                                                        key={column.key}
                                                        className="text-right whitespace-nowrap tabular-nums"
                                                    >
                                                        {formatAmount(row[column.key])}
                                                    </Table.Td>
                                                ))}
                                            </Table.Tr>
                                        ))}
                                    </Table.TBody>
                                    <Table.TFoot>
                                        <Table.Tr className="border-t-2 border-gray-300 font-bold text-gray-900 dark:border-gray-600 dark:text-gray-100">
                                            <Table.Td colSpan={3}>Total ({report.rows.length} buyers)</Table.Td>
                                            {AMOUNT_COLUMNS.map((column) => (
                                                <Table.Td
                                                    key={column.key}
                                                    className="text-right whitespace-nowrap tabular-nums"
                                                >
                                                    {formatAmount(report.totals[column.key])}
                                                </Table.Td>
                                            ))}
                                        </Table.Tr>
                                    </Table.TFoot>
                                </Table>
                            )}
                        </div>
                    )}
                </Loading>
            </Card>
        </>
    )
}
