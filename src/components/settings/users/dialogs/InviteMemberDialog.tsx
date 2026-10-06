'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import InviteMemberForm from '@/components/settings/users/forms/InviteMemberForm'
import { apiInviteMember } from '@/services/members'
import type { InviteMemberFormData } from '@/@types/members/forms/MemberFormData'
import type { Member } from '@/@types/members/Member'
import type { Role } from '@/constants/roles.constant'

interface InviteMemberDialogProps {
    isOpen: boolean
    roles: readonly Role[]
    onClose: () => void
    onSaved: (member: Member) => void
}

const FORM_ID = 'invite-member-form'

/** Invite a person to the business by email. */
export default function InviteMemberDialog({ isOpen, roles, onClose, onSaved }: InviteMemberDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: InviteMemberFormData) => {
        setSaving(true)
        try {
            const member = await apiInviteMember(data)
            toastSuccess(
                member.status === 'invited'
                    ? `Invitation sent to ${member.email}.`
                    : `${member.fullName || member.email} can now work in this business.`,
            )
            onSaved(member)
        } catch (error) {
            toastError('Could not invite this person.', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} width={560} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">Invite a user</h4>
            <p className="mb-5 text-gray-500 dark:text-gray-400">
                We’ll email them a link to set their password. People who already have an account are added straight
                away.
            </p>
            {isOpen && <InviteMemberForm id={FORM_ID} roles={roles} onSubmit={onSubmit} />}
            <div className="mt-6 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    Send invitation
                </Button>
            </div>
        </Dialog>
    )
}
