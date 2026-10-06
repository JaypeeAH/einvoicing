'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable'
import DebounceInput from '@/components/shared/DebounceInput'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import AuditLogDialog from '@/components/settings/audit-trail/dialogs/AuditLogDialog'
import { useAuditLogsStore } from '@/stores/AuditLogsStore'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { formatDateTime } from '@/utils/date'
import { AUDIT_ACTION_OPTIONS, AUDIT_ENTITY_TYPE_LABELS, getAuditEntityTypeLabel } from '@/@types/audit/AuditLogOptions'
import { AuditTrailNavIcon, ClearIcon, SearchIcon } from '@/configs/icons.config'
import type { AuditLog } from '@/@types/audit/AuditLog'
import type { Option } from '@/@types/common'

const ALL_RECORDS = ''

const ENTITY_TYPE_OPTIONS: Option[] = [
    { value: ALL_RECORDS, label: 'All records' },
    ...Object.entries(AUDIT_ENTITY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

/** Append-only record of who did what and when (RMC 5-2021), with search and filters. */
export default function AuditTrailClientPage() {
    useSetBreadcrumbs([{ label: 'Administration' }, { label: 'Audit Trail' }])

    const { records, total, page, size, query, filter, loading, error } = useAuditLogsStore()
    const { setPage, setQuery, setFilter, resetFilter } = useAuditLogsStore()

    const [viewing, setViewing] = useState<AuditLog | null>(null)

    const hasFilters = !!(query || filter.entityType || filter.dateFrom || filter.dateTo)

    const columns: DataTableColumn<AuditLog>[] = [
        {
            key: 'createdAt',
            header: 'Date and time',
            cell: (row) => <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>,
        },
        {
            key: 'user',
            header: 'User',
            cell: (row) => row.userEmail ?? <span className="text-gray-500 dark:text-gray-400">System</span>,
            hideBelow: 'md',
        },
        { key: 'action', header: 'Action', cell: (row) => <StatusBadge option={AUDIT_ACTION_OPTIONS[row.action]} /> },
        {
            key: 'entityType',
            header: 'Record',
            cell: (row) => getAuditEntityTypeLabel(row.entityType),
            hideBelow: 'lg',
        },
        {
            key: 'summary',
            header: 'Summary',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="text-gray-900 dark:text-gray-100">{row.summary}</div>
                    <div className="text-xs text-gray-500 md:hidden">{row.userEmail ?? 'System'}</div>
                </div>
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Audit trail"
                description="Every change made in this business — who did it and when. Use it to answer questions from your accountant or a BIR examiner."
            />
            <Alert type="info" showIcon duration={0} className="mb-4">
                <span className="font-normal">
                    The audit trail is append-only: entries are added automatically and can’t be edited or deleted by
                    anyone, as required for computerized accounting systems (RMC 5-2021).
                </span>
            </Alert>
            <Card>
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <DebounceInput
                        size="sm"
                        prefix={<SearchIcon className="text-lg" />}
                        placeholder="Search summary or user"
                        value={query}
                        onChange={setQuery}
                    />
                    <Select<Option>
                        size="sm"
                        options={ENTITY_TYPE_OPTIONS}
                        value={ENTITY_TYPE_OPTIONS.find(
                            (option) => option.value === (filter.entityType ?? ALL_RECORDS),
                        )}
                        onChange={(option) => setFilter({ entityType: option?.value || undefined })}
                        isSearchable={false}
                        aria-label="Record type"
                    />
                    <Input
                        size="sm"
                        type="date"
                        aria-label="From date"
                        title="From date"
                        value={filter.dateFrom ?? ''}
                        max={filter.dateTo || undefined}
                        onChange={(e) => setFilter({ dateFrom: e.target.value || undefined })}
                    />
                    <Input
                        size="sm"
                        type="date"
                        aria-label="To date"
                        title="To date"
                        value={filter.dateTo ?? ''}
                        min={filter.dateFrom || undefined}
                        onChange={(e) => setFilter({ dateTo: e.target.value || undefined })}
                    />
                    <Button size="sm" icon={<ClearIcon />} disabled={!hasFilters} onClick={resetFilter}>
                        Clear
                    </Button>
                </div>
                <DataTable
                    columns={columns}
                    records={records}
                    rowKey={(row) => String(row.id)}
                    loading={loading}
                    error={error}
                    onRowClick={(row) => setViewing(row)}
                    paging={{ page, size, total, onChange: setPage }}
                    empty={
                        <EmptyState
                            icon={<AuditTrailNavIcon />}
                            title={hasFilters ? 'No entries match your filters' : 'No activity yet'}
                            description={
                                hasFilters
                                    ? 'Try a different date range or record type.'
                                    : 'Changes to invoices, customers, settings and users will appear here.'
                            }
                        />
                    }
                />
            </Card>

            <AuditLogDialog log={viewing} onClose={() => setViewing(null)} />
        </>
    )
}
