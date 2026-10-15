'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { toastError, toastSuccess, toastWarning } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EisConnectionDialog from '@/components/transmissions/dialogs/EisConnectionDialog'
import { apiDeleteEisConnection, apiTestEisConnection, useSWREisConnection } from '@/services/transmissions'
import useAuthority from '@/utils/hooks/useAuthority'
import { formatDateTime } from '@/utils/date'
import { ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'
import { EIS_ENVIRONMENT_LABELS } from '@/constants/bir.constant'
import { DeleteIcon, EditIcon, RefreshIcon } from '@/configs/icons.config'

/** Status of the organization's EIS credentials, with set up, test and remove. */
export default function EisConnectionCard() {
    const { data: connection, mutate } = useSWREisConnection()
    const canManage = useAuthority(ACTION_SETTINGS_MANAGE)
    const [editing, setEditing] = useState(false)
    const [removing, setRemoving] = useState(false)
    const [busy, setBusy] = useState<'test' | 'remove' | null>(null)

    if (!connection) return null

    const onTest = async () => {
        setBusy('test')
        try {
            const result = await apiTestEisConnection()
            mutate(result, { revalidate: false })
            if (result.lastTestOk) toastSuccess('Connected to the EIS.')
            else toastWarning(result.lastTestMessage ?? 'The EIS rejected the credentials.')
        } catch (error) {
            toastError('Could not test the EIS connection.', error)
        } finally {
            setBusy(null)
        }
    }

    const onRemove = async () => {
        setBusy('remove')
        try {
            mutate(await apiDeleteEisConnection(), { revalidate: false })
            toastSuccess('EIS connection removed.')
            setRemoving(false)
        } catch (error) {
            toastError('Could not remove the EIS connection.', error)
        } finally {
            setBusy(null)
        }
    }

    const details: [string, string | null][] = [
        ['Environment', connection.environment ? EIS_ENVIRONMENT_LABELS[connection.environment] : null],
        ['API address', connection.apiBaseUrl],
        ['EIS Cert Number', connection.accreditationId],
        ['Application ID', connection.applicationId],
        ['Portal user ID', connection.userId],
        ['Signing key ID', connection.jwsKeyId],
        ['Last test', connection.lastTestedAt ? formatDateTime(connection.lastTestedAt) : 'Not tested yet'],
    ]

    return (
        <Card
            className="mb-4"
            header={{
                content: 'EIS connection',
                extra: canManage && (
                    <div className="flex gap-2">
                        {connection.configured && (
                            <Button
                                size="xs"
                                icon={<RefreshIcon />}
                                loading={busy === 'test'}
                                disabled={!!busy}
                                onClick={onTest}
                            >
                                Test connection
                            </Button>
                        )}
                        <Button
                            size="xs"
                            variant={connection.configured ? 'default' : 'solid'}
                            icon={<EditIcon />}
                            disabled={!!busy || !connection.canStoreCredentials}
                            onClick={() => setEditing(true)}
                        >
                            {connection.configured ? 'Edit' : 'Set up'}
                        </Button>
                        {connection.configured && (
                            <Button size="xs" icon={<DeleteIcon />} disabled={!!busy} onClick={() => setRemoving(true)}>
                                Remove
                            </Button>
                        )}
                    </div>
                ),
            }}
        >
            {connection.provider === 'mock' && (
                <Alert type="info" showIcon className="mb-4" duration={0}>
                    <div className="font-normal">
                        This deployment simulates the EIS (EIS_PROVIDER=mock): e-invoices are checked against BIR&apos;s
                        format but nothing is sent to BIR. Saved credentials are used once the server switches to
                        EIS_PROVIDER=bir.
                    </div>
                </Alert>
            )}
            {!connection.canStoreCredentials && (
                <Alert type="warning" showIcon className="mb-4" duration={0}>
                    <div className="font-normal">
                        EIS_CREDENTIALS_KEY is not configured on the server, so EIS credentials cannot be saved.
                    </div>
                </Alert>
            )}
            {connection.configured ? (
                <>
                    {connection.lastTestedAt && (
                        <Alert
                            type={connection.lastTestOk ? 'success' : 'danger'}
                            showIcon
                            className="mb-4"
                            duration={0}
                        >
                            <div className="font-normal break-words">{connection.lastTestMessage}</div>
                        </Alert>
                    )}
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                        {details.map(([label, value]) => (
                            <div key={label} className="flex min-w-0 justify-between gap-3 sm:block">
                                <dt className="text-gray-500">{label}</dt>
                                <dd className="truncate font-medium text-gray-900 dark:text-gray-100">
                                    {value || '—'}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </>
            ) : (
                <p className="text-sm text-gray-500">
                    Not set up. After BIR approves your EIS Certification portal account, create an application there,
                    generate its application key and digital signing key pair, and enter them here. Use the sandbox
                    until BIR issues your EIS Certificate and Permit to Transmit (PTT).
                </p>
            )}

            <EisConnectionDialog
                isOpen={editing}
                connection={connection}
                onClose={() => setEditing(false)}
                onSaved={(saved) => {
                    mutate(saved, { revalidate: false })
                    setEditing(false)
                }}
            />
            <ConfirmDialog
                isOpen={removing}
                type="danger"
                title="Remove the EIS connection?"
                confirmText="Remove"
                onConfirm={onRemove}
                onClose={() => setRemoving(false)}
                confirmButtonProps={{ loading: busy === 'remove' }}
            >
                Pending invoices stay queued and are not sent until a connection is set up again.
            </ConfirmDialog>
        </Card>
    )
}
