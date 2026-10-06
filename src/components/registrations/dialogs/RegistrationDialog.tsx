'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import RegistrationForm from '@/components/registrations/forms/RegistrationForm'
import { apiCreateRegistration, apiUpdateRegistration } from '@/services/registrations'
import { REGISTRATION_TYPE_INFO, type RegistrationType } from '@/constants/bir.constant'
import type { Registration } from '@/@types/registrations/Registration'
import type { RegistrationFormData } from '@/@types/registrations/forms/RegistrationFormData'

interface RegistrationDialogProps {
    isOpen: boolean
    registrationType: RegistrationType | null
    /** Record to update; omit to add a new record. */
    registration?: Registration | null
    suggestedDueOn?: string | null
    onClose: () => void
    onSaved: (registration: Registration) => void
}

const FORM_ID = 'registration-form'

/** Add or update a BIR registration or permit record. */
export default function RegistrationDialog({
    isOpen,
    registrationType,
    registration,
    suggestedDueOn,
    onClose,
    onSaved,
}: RegistrationDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: RegistrationFormData) => {
        setSaving(true)
        try {
            const saved = registration
                ? await apiUpdateRegistration(registration.id, data)
                : await apiCreateRegistration(data)
            toastSuccess(registration ? 'Record updated.' : 'Record added.')
            onSaved(saved)
        } catch (error) {
            toastError('Could not save the record.', error)
        } finally {
            setSaving(false)
        }
    }

    const info = registrationType ? REGISTRATION_TYPE_INFO[registrationType] : null

    return (
        <Dialog isOpen={isOpen} width={640} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">
                {registration ? 'Update' : 'Add'} {info?.short ?? 'record'}
            </h4>
            <p className="mb-5 text-gray-500">{info?.label}</p>
            {isOpen && registrationType && (
                <RegistrationForm
                    key={registration?.id ?? `new-${registrationType}`}
                    id={FORM_ID}
                    registrationType={registrationType}
                    registration={registration}
                    suggestedDueOn={suggestedDueOn}
                    onSubmit={onSubmit}
                />
            )}
            <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    {registration ? 'Save changes' : 'Add record'}
                </Button>
            </div>
        </Dialog>
    )
}
