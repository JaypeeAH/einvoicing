'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import BranchForm from '@/components/settings/branches/forms/BranchForm'
import { apiCreateBranch, apiUpdateBranch } from '@/services/branches'
import type { Branch } from '@/@types/branches/Branch'
import type { BranchFormData } from '@/@types/branches/forms/BranchFormData'

interface BranchDialogProps {
    isOpen: boolean
    branch?: Branch | null
    onClose: () => void
    onSaved: (branch: Branch) => void
}

const FORM_ID = 'branch-form'

/** Add or edit a branch. */
export default function BranchDialog({ isOpen, branch, onClose, onSaved }: BranchDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: BranchFormData) => {
        setSaving(true)
        try {
            const saved = branch ? await apiUpdateBranch(branch.id, data) : await apiCreateBranch(data)
            toastSuccess(branch ? 'Branch updated.' : 'Branch added.')
            onSaved(saved)
        } catch (error) {
            toastError('Could not save the branch.', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} width={640} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">{branch ? 'Edit branch' : 'Add branch'}</h4>
            <p className="mb-5 text-gray-500 dark:text-gray-400">
                {branch
                    ? 'Changes apply to new invoices only — issued invoices keep the branch details they were issued with.'
                    : 'Add a branch only after it is registered with the BIR. Then register its own invoice series.'}
            </p>
            {isOpen && <BranchForm key={branch?.id ?? 'new'} id={FORM_ID} branch={branch} onSubmit={onSubmit} />}
            <div className="mt-6 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    {branch ? 'Save changes' : 'Add branch'}
                </Button>
            </div>
        </Dialog>
    )
}
