'use client'

import { useState } from 'react'
import Link from 'next/link'
import dayjs from 'dayjs'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import { useTransmissionsStore } from '@/stores/TransmissionsStore'
import { useOrganizationStore } from '@/stores/OrganizationStore'
import { apiSendTransmissions } from '@/services/transmissions'
import useAuthority from '@/utils/hooks/useAuthority'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { formatDateTime } from '@/utils/date'
import classNames from '@/utils/classNames'
import { ACTION_COMPLIANCE_MANAGE } from '@/constants/actions.constant'
import {
    DOCUMENT_TYPE_LABELS,
    EIS_TRANSMISSION_DAYS,
    TRANSMISSION_STATUSES,
    TRANSMISSION_STATUS_LABELS,
    type TransmissionStatus,
} from '@/constants/bir.constant'
import { companySettingsPath, compliancePath, getInvoicePath, isTestEnvironment } from '@/configs/app.config'
import { TRANSMISSION_STATUS_OPTIONS } from '@/@types/invoices/InvoiceStatusOptions'
import { RefreshIcon, SendIcon, TransmissionsNavIcon } from '@/configs/icons.config'
import type { EisTransmission } from '@/@types/transmissions/EisTransmission'
import type { Option } from '@/@types/common'

const ALL_STATUSES: Option<TransmissionStatus | ''> = { value: '', label: 'All statuses' }
const STATUS_OPTIONS: Option<TransmissionStatus | ''>[] = [
    ALL_STATUSES,
    ...TRANSMISSION_STATUSES.map((value) => ({ value, label: TRANSMISSION_STATUS_LABELS[value] })),
]

const RETRYABLE: TransmissionStatus[] = ['queued', 'failed', 'rejected']
const FINISHED: TransmissionStatus[] = ['accepted', 'cancelled']

const isOverdue = (row: EisTransmission) => !FINISHED.includes(row.status) && dayjs(row.dueAt).isBefore(dayjs())

/** EIS transmission queue: status of each invoice sent to BIR, with send-now and retry. */
export default function TransmissionsClientPage() {
    useSetBreadcrumbs([{ label: 'BIR Compliance', href: compliancePath }, { label: 'EIS Transmissions' }])

    const { records, total, page, size, filter, loading, error } = useTransmissionsStore()
    const { setPage, setFilter, refreshPage } = useTransmissionsStore()
    const eisEnabled = useOrganizationStore((state) => state.data?.eisTransmissionEnabled)
    const canManage = useAuthority(ACTION_COMPLIANCE_MANAGE)

    const [sendingAll, setSendingAll] = useState(false)
    const [retryingId, setRetryingId] = useState<string | null>(null)

    const onSendPending = async () => {
        setSendingAll(true)
        try {
            await apiSendTransmissions()
            toastSuccess('Pending invoices were sent. Check the status of each one below.')
            refreshPage()
        } catch (error) {
            toastError('Could not send pending invoices.', error)
        } finally {
            setSendingAll(false)
        }
    }

    const onRetry = async (row: EisTransmission) => {
        setRetryingId(row.id)
        try {
            await apiSendTransmissions(row.id)
            toastSuccess(`${row.invoiceNumber ?? 'Invoice'} was sent again.`)
            refreshPage()
        } catch (error) {
            toastError('Could not resend the invoice.', error)
        } finally {
            setRetryingId(null)
        }
    }

    const columns: DataTableColumn<EisTransmission>[] = [
        {
            key: 'document',
            header: 'Document',
            cell: (row) => (
                <div className="min-w-0">
                    <Link
                        href={getInvoicePath(row.invoiceId)}
                        className="font-semibold text-gray-900 hover:text-primary dark:text-gray-100"
                    >
                        {row.invoiceNumber ?? 'View invoice'}
                    </Link>
                    <div className="text-xs text-gray-500">{DOCUMENT_TYPE_LABELS[row.documentType]}</div>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge option={TRANSMISSION_STATUS_OPTIONS[row.status]} />,
        },
        { key: 'attempts', header: 'Attempts', align: 'center', cell: (row) => row.attempts, hideBelow: 'md' },
        {
            key: 'due',
            header: 'Due',
            cell: (row) => (
                <span className={classNames('whitespace-nowrap', isOverdue(row) && 'font-semibold text-error')}>
                    {formatDateTime(row.dueAt)}
                    {isOverdue(row) && <span className="block text-xs">Overdue</span>}
                </span>
            ),
            hideBelow: 'sm',
        },
        {
            key: 'lastAttempt',
            header: 'Last attempt',
            cell: (row) => <span className="whitespace-nowrap">{formatDateTime(row.lastAttemptAt) || '—'}</span>,
            hideBelow: 'lg',
        },
        { key: 'birReference', header: 'BIR reference', cell: (row) => row.birReference || '—', hideBelow: 'lg' },
        {
            key: 'response',
            header: 'Response',
            cell: (row) => <span className="text-sm text-gray-500">{row.responseMessage || '—'}</span>,
            hideBelow: 'md',
        },
        {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (row) =>
                canManage && RETRYABLE.includes(row.status) ? (
                    <Button
                        size="xs"
                        icon={<RefreshIcon />}
                        loading={retryingId === row.id}
                        disabled={sendingAll || (!!retryingId && retryingId !== row.id)}
                        onClick={() => onRetry(row)}
                    >
                        Retry
                    </Button>
                ) : null,
        },
    ]

    return (
        <>
            <PageHeader
                title="EIS Transmissions"
                description="Issued invoices sent to the BIR Electronic Invoicing System (EIS) and BIR’s response to each one."
                actions={
                    canManage && (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<SendIcon />}
                            loading={sendingAll}
                            disabled={!!retryingId}
                            onClick={onSendPending}
                        >
                            Send pending now
                        </Button>
                    )
                }
            />

            <Alert type="info" showIcon className="mb-4" duration={0}>
                <div className="font-normal">
                    Transmission only applies once your company turns on EIS transmission, after BIR issues you a Permit
                    to Transmit (PTT). From then on, each invoice must reach BIR within {EIS_TRANSMISSION_DAYS} days of
                    issue.
                    {isTestEnvironment && ' This is a test environment: a mock EIS is used and nothing is sent to BIR.'}
                </div>
            </Alert>

            {eisEnabled === false && (
                <Alert type="warning" showIcon className="mb-4" duration={0}>
                    <div className="font-normal">
                        EIS transmission is turned off for your company, so new invoices are not queued.{' '}
                        <Link href={companySettingsPath} className="font-semibold underline">
                            Company settings
                        </Link>
                    </div>
                </Alert>
            )}

            <Card>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="sm:w-60">
                        <Select<Option<TransmissionStatus | ''>>
                            size="sm"
                            options={STATUS_OPTIONS}
                            value={
                                STATUS_OPTIONS.find((option) => option.value === (filter.status ?? '')) ?? ALL_STATUSES
                            }
                            onChange={(option) => setFilter({ status: option?.value || undefined })}
                            isSearchable={false}
                        />
                    </div>
                    <span className="text-sm text-gray-500">Refreshes every minute</span>
                </div>
                <DataTable
                    columns={columns}
                    records={records}
                    rowKey={(row) => row.id}
                    loading={loading}
                    error={error}
                    paging={{ page, size, total, onChange: setPage }}
                    empty={
                        <EmptyState
                            icon={<TransmissionsNavIcon />}
                            title={filter.status ? 'No transmissions with this status' : 'Nothing transmitted yet'}
                            description="Once EIS transmission is on, every invoice you issue is queued here and sent to BIR automatically."
                        />
                    }
                />
            </Card>
        </>
    )
}
