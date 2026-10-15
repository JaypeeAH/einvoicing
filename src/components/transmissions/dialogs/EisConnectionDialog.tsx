'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import EisConnectionForm from '@/components/transmissions/forms/EisConnectionForm'
import { apiSaveEisConnection } from '@/services/transmissions'
import { EisConnectionFormSchema, type EisConnectionFormData } from '@/@types/transmissions/forms/EisConnectionFormData'
import type { EisConnectionSummary } from '@/@types/transmissions/EisConnectionSummary'

interface EisConnectionDialogProps {
    isOpen: boolean
    connection: EisConnectionSummary | null
    onClose: () => void
    onSaved: (connection: EisConnectionSummary) => void
}

const FORM_ID = 'eis-connection-form'

/** Set up or change the credentials used to transmit to the BIR EIS. */
export default function EisConnectionDialog({ isOpen, connection, onClose, onSaved }: EisConnectionDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: EisConnectionFormData) => {
        setSaving(true)
        try {
            const saved = await apiSaveEisConnection(EisConnectionFormSchema.parse(data))
            toastSuccess('EIS connection saved. Test it to check the credentials.')
            onSaved(saved)
        } catch (error) {
            toastError('Could not save the EIS connection.', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} width={720} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">EIS connection</h4>
            <p className="mb-5 text-gray-500">
                Copy these from the EIS Certification portal (eis-cert.bir.gov.ph → Applications → your application →
                Setting). Keys and passwords are stored encrypted and are never shown again.
            </p>
            {isOpen && <EisConnectionForm id={FORM_ID} connection={connection} onSubmit={onSubmit} />}
            <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    Save connection
                </Button>
            </div>
        </Dialog>
    )
}
