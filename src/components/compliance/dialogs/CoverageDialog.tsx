'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import CoverageForm from '@/components/compliance/forms/CoverageForm'
import { apiCreateAssessment } from '@/services/compliance'
import type { CoverageAnswers, CoverageAssessment } from '@/@types/compliance/CoverageAssessment'
import type { TaxpayerSize } from '@/constants/bir.constant'

interface CoverageDialogProps {
    isOpen: boolean
    answers?: CoverageAnswers | null
    defaultTaxpayerSize?: TaxpayerSize | null
    onClose: () => void
    onSaved: (assessment: CoverageAssessment) => void
}

const FORM_ID = 'coverage-form'

/** Asks the coverage questions and saves the answers (the server records the result). */
export default function CoverageDialog({
    isOpen,
    answers,
    defaultTaxpayerSize,
    onClose,
    onSaved,
}: CoverageDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: CoverageAnswers) => {
        setSaving(true)
        try {
            const saved = await apiCreateAssessment(data)
            toastSuccess('Your answers were saved.')
            onSaved(saved)
        } catch (error) {
            toastError('Could not save your answers.', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} width={680} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">Do I need to e-invoice?</h4>
            <p className="mb-4 text-gray-500">
                Answer a few questions about your business. This is guidance based on RR 26-2025 and RMC 98-2026 —
                confirm with your RDO.
            </p>
            <div className="max-h-[60vh] overflow-y-auto pr-1">
                {isOpen && (
                    <CoverageForm
                        id={FORM_ID}
                        answers={answers}
                        defaultTaxpayerSize={defaultTaxpayerSize}
                        onSubmit={onSubmit}
                    />
                )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    Save answers
                </Button>
            </div>
        </Dialog>
    )
}
