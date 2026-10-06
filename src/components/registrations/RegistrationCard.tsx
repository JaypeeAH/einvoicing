'use client'

import dayjs from 'dayjs'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDateOnly, todayInManila } from '@/utils/date'
import classNames from '@/utils/classNames'
import { REGISTRATION_TYPE_INFO, type RegistrationType } from '@/constants/bir.constant'
import { REGISTRATION_STATUS_OPTIONS } from '@/@types/registrations/RegistrationStatusOptions'
import { AddIcon, DeleteIcon, DueDateIcon, EditIcon } from '@/configs/icons.config'
import type { Registration } from '@/@types/registrations/Registration'

interface RegistrationCardProps {
    step: number
    registrationType: RegistrationType
    /** Most recent record of this type. */
    latest?: Registration
    /** Number of older records of this type. */
    olderCount: number
    /** Due date derived from another record (EIS certification: 6 months after the PTI). */
    derivedDueOn?: string | null
    canManage: boolean
    canDelete: boolean
    onAdd: () => void
    onEdit: (registration: Registration) => void
    onDelete: (registration: Registration) => void
}

/** Days until `date` (negative when past), counted in Manila calendar days. */
const daysUntil = (date: string) => dayjs(date).diff(dayjs(todayInManila()), 'day')

/** One BIR registration/permit: what it is, its latest status, permit number, dates and notes. */
export default function RegistrationCard({
    step,
    registrationType,
    latest,
    olderCount,
    derivedDueOn,
    canManage,
    canDelete,
    onAdd,
    onEdit,
    onDelete,
}: RegistrationCardProps) {
    const info = REGISTRATION_TYPE_INFO[registrationType]
    const dueOn = latest?.dueOn ?? derivedDueOn ?? null
    const showDue = !!dueOn && latest?.status !== 'approved'
    const days = dueOn ? daysUntil(dueOn) : null
    const overdue = showDue && days !== null && days < 0
    const dueSoon = showDue && days !== null && days >= 0 && days <= 30
    const canStartOver = latest && (latest.status === 'rejected' || latest.status === 'revoked')

    return (
        <Card className="h-full" bodyClass="flex h-full flex-col gap-3">
            <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle font-bold text-primary">
                    {step}
                </span>
                <div className="min-w-0 flex-auto">
                    <div className="flex flex-wrap items-center gap-2">
                        <h5 className="heading-text">{info.label}</h5>
                        <StatusBadge
                            option={
                                latest
                                    ? REGISTRATION_STATUS_OPTIONS[latest.status]
                                    : REGISTRATION_STATUS_OPTIONS.not_started
                            }
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{info.description}</p>
                    <p className="mt-1 text-xs text-gray-400">Basis: {info.basis}</p>
                </div>
            </div>

            {latest && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-gray-50 p-3 text-sm sm:grid-cols-3 dark:bg-gray-700/40">
                    <Field label="Reference no." value={latest.referenceNumber} />
                    <Field label="RDO" value={latest.rdoCode} />
                    <Field
                        label="System"
                        value={
                            latest.systemName
                                ? `${latest.systemName}${latest.systemVersion ? ` v${latest.systemVersion}` : ''}`
                                : null
                        }
                    />
                    <Field label="Filed on" value={formatDateOnly(latest.filedOn)} />
                    <Field label="Approved on" value={formatDateOnly(latest.approvedOn)} />
                    <Field label="Due on" value={formatDateOnly(latest.dueOn)} />
                </dl>
            )}

            {showDue && dueOn && (
                <div
                    className={classNames(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
                        overdue
                            ? 'bg-error-subtle text-error'
                            : dueSoon
                              ? 'bg-warning-subtle text-warning'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                    )}
                >
                    <DueDateIcon className="shrink-0 text-lg" />
                    {overdue
                        ? `Overdue since ${formatDateOnly(dueOn)}`
                        : `Due by ${formatDateOnly(dueOn)}${days !== null ? ` (${days} day${days === 1 ? '' : 's'} left)` : ''}`}
                </div>
            )}

            {latest?.notes && (
                <p className="text-sm whitespace-pre-line text-gray-600 dark:text-gray-300">{latest.notes}</p>
            )}
            {olderCount > 0 && (
                <p className="text-xs text-gray-400">
                    {olderCount} earlier record{olderCount === 1 ? '' : 's'} kept for your history.
                </p>
            )}

            {(canManage || (canDelete && latest)) && (
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {canManage && !latest && (
                        <Button size="xs" variant="solid" icon={<AddIcon />} onClick={onAdd}>
                            Add record
                        </Button>
                    )}
                    {canManage && latest && (
                        <Button size="xs" icon={<EditIcon />} onClick={() => onEdit(latest)}>
                            Update
                        </Button>
                    )}
                    {canManage && canStartOver && (
                        <Button size="xs" icon={<AddIcon />} onClick={onAdd}>
                            New application
                        </Button>
                    )}
                    {canDelete && latest && (
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<DeleteIcon />}
                            className="hover:text-error"
                            onClick={() => onDelete(latest)}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            )}
        </Card>
    )
}

interface FieldProps {
    label: string
    value: string | null | undefined
}

/** Label/value pair inside the record summary. */
function Field({ label, value }: FieldProps) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="truncate font-semibold text-gray-800 dark:text-gray-100">{value || '—'}</dd>
        </div>
    )
}
