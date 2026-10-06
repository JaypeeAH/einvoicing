'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'
import Skeleton from '@/components/ui/Skeleton'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import RegistrationCard from '@/components/registrations/RegistrationCard'
import RegistrationDialog from '@/components/registrations/dialogs/RegistrationDialog'
import { useRegistrationsStore } from '@/stores/RegistrationsStore'
import { apiDeleteRegistration } from '@/services/registrations'
import useAuthority from '@/utils/hooks/useAuthority'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { ACTION_COMPLIANCE_MANAGE, ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'
import {
    EIS_CERTIFICATION_MONTHS_AFTER_PTI,
    REGISTRATION_TYPES,
    REGISTRATION_TYPE_INFO,
    type RegistrationType,
} from '@/constants/bir.constant'
import { compliancePath } from '@/configs/app.config'
import { NextIcon } from '@/configs/icons.config'
import type { Registration } from '@/@types/registrations/Registration'

const STEP_NOTES: Record<RegistrationType, string> = {
    cor: '',
    cas_ac: '',
    pti: '',
    eis_certification: `within ${EIS_CERTIFICATION_MONTHS_AFTER_PTI} months`,
    ptt: 'when BIR requires',
}

interface EditingState {
    registrationType: RegistrationType
    registration: Registration | null
}

/** BIR registrations and permits for this invoicing system, in the order they are obtained. */
export default function RegistrationsClientPage() {
    useSetBreadcrumbs([{ label: 'BIR Compliance', href: compliancePath }, { label: 'Registrations & Permits' }])

    const { data, loading, error, refresh } = useRegistrationsStore()
    const canManage = useAuthority(ACTION_COMPLIANCE_MANAGE)
    const canDelete = useAuthority(ACTION_SETTINGS_MANAGE)

    const [editing, setEditing] = useState<EditingState | null>(null)
    const [deleting, setDeleting] = useState<Registration | null>(null)
    const [deletingBusy, setDeletingBusy] = useState(false)

    const registrations = data ?? []
    const byType = (type: RegistrationType) => registrations.filter((item) => item.registrationType === type)

    const approvedPti = registrations.find((item) => item.registrationType === 'pti' && item.status === 'approved')
    const eisDueOn = approvedPti?.approvedOn
        ? dayjs(approvedPti.approvedOn).add(EIS_CERTIFICATION_MONTHS_AFTER_PTI, 'month').format('YYYY-MM-DD')
        : null

    const onDelete = async () => {
        if (!deleting) return
        setDeletingBusy(true)
        try {
            await apiDeleteRegistration(deleting.id)
            toastSuccess('Record deleted.')
            setDeleting(null)
            refresh()
        } catch (error) {
            toastError('Could not delete the record.', error)
        } finally {
            setDeletingBusy(false)
        }
    }

    return (
        <>
            <PageHeader
                title="Registrations & Permits"
                description="Keep track of the BIR registrations and permits you hold for issuing invoices from this system."
            />

            <Card className="mb-4">
                <div className="mb-2 font-semibold text-gray-900 dark:text-gray-100">The usual order</div>
                <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
                    {REGISTRATION_TYPES.map((type, index) => (
                        <li key={type} className="inline-flex items-center gap-1">
                            {index > 0 && <NextIcon className="text-gray-400" aria-hidden />}
                            <span className="rounded-lg bg-primary-subtle px-2 py-1 font-semibold text-primary">
                                {REGISTRATION_TYPE_INFO[type].short}
                                {STEP_NOTES[type] && <span className="font-normal"> ({STEP_NOTES[type]})</span>}
                            </span>
                        </li>
                    ))}
                </ol>
                <p className="mt-3 text-sm text-gray-500">
                    Start with your Certificate of Registration, then register this system with your RDO to get the CAS
                    Acknowledgment Certificate. If you are covered by e-invoicing, apply for a Permit to Issue (PTI) and
                    complete EIS certification within {EIS_CERTIFICATION_MONTHS_AFTER_PTI} months. A Permit to Transmit
                    (PTT) is only needed once BIR requires you to transmit your sales data.
                </p>
            </Card>

            {error && (
                <Alert type="danger" showIcon className="mb-4" duration={0}>
                    {error}
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {!data && loading
                    ? REGISTRATION_TYPES.map((type) => (
                          <Card key={type}>
                              <Skeleton height={20} className="mb-3" />
                              <Skeleton height={60} />
                          </Card>
                      ))
                    : REGISTRATION_TYPES.map((type, index) => {
                          const records = byType(type)
                          return (
                              <RegistrationCard
                                  key={type}
                                  step={index + 1}
                                  registrationType={type}
                                  latest={records[0]}
                                  olderCount={Math.max(records.length - 1, 0)}
                                  derivedDueOn={type === 'eis_certification' ? eisDueOn : null}
                                  canManage={canManage}
                                  canDelete={canDelete}
                                  onAdd={() => setEditing({ registrationType: type, registration: null })}
                                  onEdit={(registration) => setEditing({ registrationType: type, registration })}
                                  onDelete={setDeleting}
                              />
                          )
                      })}
            </div>

            <Alert type="info" showIcon className="mt-4" duration={0}>
                BIR does not accredit invoicing software. These permits and certificates are issued to you as the
                taxpayer — confirm requirements with your RDO.
            </Alert>

            <RegistrationDialog
                isOpen={!!editing}
                registrationType={editing?.registrationType ?? null}
                registration={editing?.registration}
                suggestedDueOn={editing?.registrationType === 'eis_certification' ? eisDueOn : null}
                onClose={() => setEditing(null)}
                onSaved={() => {
                    setEditing(null)
                    refresh()
                }}
            />
            <ConfirmDialog
                isOpen={!!deleting}
                type="danger"
                title="Delete this record?"
                confirmText="Delete"
                onClose={() => setDeleting(null)}
                onConfirm={onDelete}
                closable={!deletingBusy}
                confirmButtonProps={{ loading: deletingBusy }}
            >
                The <strong>{deleting ? REGISTRATION_TYPE_INFO[deleting.registrationType].label : ''}</strong> record
                {deleting?.referenceNumber ? ` (${deleting.referenceNumber})` : ''} will be removed. Only delete records
                entered by mistake — keep rejected or revoked permits for your history.
            </ConfirmDialog>
        </>
    )
}
