'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Progress from '@/components/ui/Progress'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import SeriesDialog from '@/components/settings/series/dialogs/SeriesDialog'
import { useSeriesStore } from '@/stores/SeriesStore'
import { useBranchesStore } from '@/stores/BranchesStore'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { formatDateOnly } from '@/utils/date'
import classNames from '@/utils/classNames'
import {
    formatSerialNumber,
    formatSeriesRange,
    getRemainingSerials,
    isSeriesRunningLow,
} from '@/utils/invoices/invoiceNumber'
import { DOCUMENT_TYPE_LABELS } from '@/constants/bir.constant'
import { AddIcon, EditIcon, InfoIcon, SeriesNavIcon } from '@/configs/icons.config'
import type { Branch } from '@/@types/branches/Branch'
import type { DocumentSeries } from '@/@types/series/DocumentSeries'

const ACTIVE_BADGE = { value: 'active', label: 'Active', badgeClass: 'bg-success-subtle text-success' }
const INACTIVE_BADGE = {
    value: 'inactive',
    label: 'Inactive',
    badgeClass: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
}

const GUIDANCE = [
    'Get each range from your CAS Acknowledgment Certificate and enter it exactly as approved.',
    'Numbers are assigned only when an invoice is issued, so drafts never use up or skip a number.',
    'Each branch can have one active series per document type.',
]

const EMPTY_SERIES: DocumentSeries[] = []
const EMPTY_BRANCHES: Branch[] = []

interface SeriesUsageProps {
    series: DocumentSeries
}

/** Usage bar and numbers left for one series. */
function SeriesUsage({ series }: SeriesUsageProps) {
    const size = series.endNumber - series.startNumber + 1
    const used = Math.min(series.nextNumber - series.startNumber, size)
    const remaining = getRemainingSerials(series)
    const low = isSeriesRunningLow(series)
    const percent = size > 0 ? Math.min(100, Math.round((used / size) * 100)) : 0

    return (
        <div className="min-w-32">
            <Progress
                percent={remaining === 0 ? 100 : percent}
                showInfo={false}
                size="sm"
                customColorClass={remaining === 0 ? 'bg-error' : low ? 'bg-warning' : undefined}
            />
            <div
                className={classNames(
                    'mt-1 text-xs',
                    remaining === 0 ? 'font-semibold text-error' : low ? 'font-semibold text-warning' : 'text-gray-500',
                )}
            >
                {remaining === 0 ? 'Used up' : `${remaining.toLocaleString()} left`}
            </div>
        </div>
    )
}

/** Registered invoice series per branch and document type, with usage and CAS AC details. */
export default function SeriesClientPage() {
    useSetBreadcrumbs([{ label: 'Administration' }, { label: 'Invoice Series' }])

    const seriesList = useSeriesStore((state) => state.data) ?? EMPTY_SERIES
    const loading = useSeriesStore((state) => state.loading)
    const error = useSeriesStore((state) => state.error)
    const refresh = useSeriesStore((state) => state.refresh)
    const branches = useBranchesStore((state) => state.data) ?? EMPTY_BRANCHES

    const [editing, setEditing] = useState<DocumentSeries | null | undefined>(undefined)

    const columns: DataTableColumn<DocumentSeries>[] = [
        {
            key: 'documentType',
            header: 'Document',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {DOCUMENT_TYPE_LABELS[row.documentType]}
                    </div>
                    <div className="text-xs text-gray-500 sm:hidden">
                        {row.branchCode} · {row.branchName}
                    </div>
                </div>
            ),
        },
        {
            key: 'branch',
            header: 'Branch',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="font-mono text-gray-900 dark:text-gray-100">{row.branchCode}</div>
                    <div className="text-xs text-gray-500">{row.branchName}</div>
                </div>
            ),
            hideBelow: 'sm',
        },
        {
            key: 'range',
            header: 'Range',
            cell: (row) => (
                <span className="font-mono text-sm whitespace-nowrap">
                    {formatSeriesRange(row.prefix, row.startNumber, row.endNumber, row.padding)}
                </span>
            ),
            hideBelow: 'lg',
        },
        {
            key: 'next',
            header: 'Next number',
            cell: (row) =>
                getRemainingSerials(row) > 0 ? (
                    <span className="font-mono text-sm whitespace-nowrap">
                        {formatSerialNumber(row.prefix, row.nextNumber, row.padding)}
                    </span>
                ) : (
                    '—'
                ),
            hideBelow: 'md',
        },
        { key: 'usage', header: 'Usage', cell: (row) => <SeriesUsage series={row} /> },
        {
            key: 'ac',
            header: 'CAS Acknowledgment Certificate',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="text-gray-900 dark:text-gray-100">{row.acNumber}</div>
                    <div className="text-xs text-gray-500">{formatDateOnly(row.acDate)}</div>
                </div>
            ),
            hideBelow: 'lg',
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge option={row.isActive ? ACTIVE_BADGE : INACTIVE_BADGE} />,
        },
        {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (row) => (
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<EditIcon />}
                        aria-label="Edit"
                        onClick={() => setEditing(row)}
                    />
                </div>
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Invoice series"
                description="The serial-number ranges BIR approved for this system. The app assigns the next number automatically, per branch and document type."
                actions={
                    <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setEditing(null)}>
                        Register series
                    </Button>
                }
            />
            <div className="mb-4 rounded-2xl bg-info-subtle p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-2 font-semibold text-info">
                    <InfoIcon className="text-xl" /> How invoice series work
                </div>
                <ul className="list-disc space-y-1 pl-6 text-gray-700 dark:text-gray-200">
                    {GUIDANCE.map((text) => (
                        <li key={text}>{text}</li>
                    ))}
                </ul>
            </div>
            <Card>
                <DataTable
                    columns={columns}
                    records={seriesList}
                    rowKey={(row) => row.id}
                    loading={loading}
                    error={error}
                    onRowClick={(row) => setEditing(row)}
                    empty={
                        <EmptyState
                            icon={<SeriesNavIcon />}
                            title="No invoice series yet"
                            description="Register the range from your CAS Acknowledgment Certificate before issuing your first invoice."
                            action={
                                <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setEditing(null)}>
                                    Register series
                                </Button>
                            }
                        />
                    }
                />
            </Card>

            <SeriesDialog
                isOpen={editing !== undefined}
                series={editing}
                branches={branches}
                allSeries={seriesList}
                onClose={() => setEditing(undefined)}
                onSaved={() => {
                    setEditing(undefined)
                    refresh()
                }}
            />
        </>
    )
}
