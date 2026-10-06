'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import EditMemberForm from '@/components/settings/users/forms/EditMemberForm'
import { apiUpdateMember } from '@/services/members'
import type { UpdateMemberFormData } from '@/@types/members/forms/MemberFormData'
import type { Member } from '@/@types/members/Member'
import type { Role } from '@/constants/roles.constant'

interface EditMemberDialogProps {
    member: Member | null
    roles: readonly Role[]
    onClose: () => void
    onSaved: (member: Member) => void
}

const FORM_ID = 'edit-member-form'

/** Change a user's role or access. */
export default function EditMemberDialog({ member, roles, onClose, onSaved }: EditMemberDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: UpdateMemberFormData) => {
        if (!member) return
        setSaving(true)
        try {
            const saved = await apiUpdateMember(member.id, data)
            toastSuccess('User updated.')
            onSaved(saved)
        } catch (error) {
            toastError('Could not update this user.', error)
        } finally {
            setSaving(false)
        }
    }

    // Keep the member's current role selectable even if the current user can't grant it
    const roleChoices = member && !roles.includes(member.role) ? [member.role, ...roles] : roles

    return (
        <Dialog isOpen={!!member} width={560} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">Edit user</h4>
            <p className="mb-5 text-gray-500 dark:text-gray-400">
                {member?.fullName || member?.email}
                {member?.fullName && <span className="text-gray-400 dark:text-gray-500"> · {member.email}</span>}
            </p>
            {member && (
                <EditMemberForm key={member.id} id={FORM_ID} member={member} roles={roleChoices} onSubmit={onSubmit} />
            )}
            <div className="mt-6 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    Save changes
                </Button>
            </div>
        </Dialog>
    )
}
