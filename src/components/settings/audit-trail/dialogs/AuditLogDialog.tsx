'use client'

import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDateTime } from '@/utils/date'
import { AUDIT_ACTION_OPTIONS, getAuditEntityTypeLabel } from '@/@types/audit/AuditLogOptions'
import { ForwardIcon } from '@/configs/icons.config'
import type { AuditLog } from '@/@types/audit/AuditLog'
import type { ReactNode } from 'react'

/** `registered_name` / `registeredName` → `Registered name` */
const toFieldLabel = (field: string) => {
    const words = field
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_.-]+/g, ' ')
        .trim()
        .toLowerCase()
    return words.charAt(0).toUpperCase() + words.slice(1)
}

const formatValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '(empty)'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

interface DetailProps {
    label: string
    children: ReactNode
}

/** One label/value pair in the entry summary. */
function Detail({ label, children }: DetailProps) {
    return (
        <div>
            <dt className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="mt-0.5 break-words text-gray-900 dark:text-gray-100">{children}</dd>
        </div>
    )
}

interface AuditLogDialogProps {
    log: AuditLog | null
    onClose: () => void
}

/** Read-only details of one audit trail entry, including each changed field (from → to). */
export default function AuditLogDialog({ log, onClose }: AuditLogDialogProps) {
    const changes = log?.changes ? Object.entries(log.changes) : []

    return (
        <Dialog isOpen={!!log} width={640} onClose={onClose} onRequestClose={onClose}>
            {log && (
                <>
                    <h4 className="heading-text mb-1 pr-8">{log.summary}</h4>
                    <p className="mb-5 text-gray-500 dark:text-gray-400">
                        Audit entries are permanent and can’t be edited or deleted.
                    </p>
                    <dl className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Detail label="Date and time">{formatDateTime(log.createdAt)}</Detail>
                        <Detail label="User">{log.userEmail ?? 'System'}</Detail>
                        <Detail label="Action">
                            <StatusBadge option={AUDIT_ACTION_OPTIONS[log.action]} />
                        </Detail>
                        <Detail label="Record">{getAuditEntityTypeLabel(log.entityType)}</Detail>
                    </dl>
                    {changes.length > 0 ? (
                        <div>
                            <h6 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">What changed</h6>
                            <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                                {changes.map(([field, change]) => (
                                    <li key={field} className="px-4 py-3">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {toFieldLabel(field)}
                                        </div>
                                        <div className="mt-1 flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:gap-2">
                                            <span className="break-all text-gray-500 line-through dark:text-gray-400">
                                                {formatValue(change?.from)}
                                            </span>
                                            <ForwardIcon className="hidden shrink-0 text-gray-400 sm:mt-0.5 sm:block" />
                                            <span className="break-all text-gray-900 dark:text-gray-100">
                                                {formatValue(change?.to)}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        log.action === 'update' && (
                            <p className="text-gray-500 dark:text-gray-400">No field-level changes were recorded.</p>
                        )
                    )}
                    <div className="mt-6 flex justify-end">
                        <Button size="sm" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </>
            )}
        </Dialog>
    )
}
