'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StatusBadge from '@/components/shared/StatusBadge'
import InviteMemberDialog from '@/components/settings/users/dialogs/InviteMemberDialog'
import EditMemberDialog from '@/components/settings/users/dialogs/EditMemberDialog'
import RolesExplainer from '@/components/settings/users/RolesExplainer'
import { useMembersStore } from '@/stores/MembersStore'
import { useSessionStore } from '@/stores/SessionStore'
import { apiRemoveMember, apiResendInvitation } from '@/services/members'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { MEMBER_STATUS_OPTIONS } from '@/@types/members/MemberStatusOptions'
import { ROLES, ROLE_LABELS, ROLE_OWNER } from '@/constants/roles.constant'
import { AddIcon, DeleteIcon, EditIcon, EmailIcon, UsersNavIcon } from '@/configs/icons.config'
import type { Member } from '@/@types/members/Member'

const EMPTY_MEMBERS: Member[] = []

/** People who can sign in to the business, their roles and access. */
export default function UsersClientPage() {
    useSetBreadcrumbs([{ label: 'Administration' }, { label: 'Users & Roles' }])

    const members = useMembersStore((state) => state.data) ?? EMPTY_MEMBERS
    const loading = useMembersStore((state) => state.loading)
    const error = useMembersStore((state) => state.error)
    const refresh = useMembersStore((state) => state.refresh)
    const currentUserId = useSessionStore((state) => state.user?.id)
    const currentRole = useSessionStore((state) => state.user?.role)

    const isOwner = currentRole === ROLE_OWNER
    // Only an owner can make someone else an owner
    const grantableRoles = isOwner ? ROLES : ROLES.filter((role) => role !== ROLE_OWNER)

    const [inviting, setInviting] = useState(false)
    const [editing, setEditing] = useState<Member | null>(null)
    const [removing, setRemoving] = useState<Member | null>(null)
    const [removingBusy, setRemovingBusy] = useState(false)
    const [resendingId, setResendingId] = useState<string | null>(null)

    const onResend = async (member: Member) => {
        setResendingId(member.id)
        try {
            const { kind } = await apiResendInvitation(member.id)
            toastSuccess(
                kind === 'invite'
                    ? `Invitation sent again to ${member.email}.`
                    : `${member.email} already has an account — we sent a link to set a new password.`,
            )
            refresh()
        } catch (error) {
            toastError('Could not send the invitation.', error)
        } finally {
            setResendingId(null)
        }
    }

    /** Why the current user can't change this member, or null when they can. */
    const getLockedReason = (member: Member) => {
        if (member.userId === currentUserId)
            return 'You can’t change your own role or access. Ask another owner or administrator.'
        if (member.role === ROLE_OWNER && !isOwner) return 'Only an owner can change another owner.'
        return null
    }

    const onRemove = async () => {
        if (!removing) return
        setRemovingBusy(true)
        try {
            await apiRemoveMember(removing.id)
            toastSuccess('User removed.')
            setRemoving(null)
            refresh()
        } catch (removeError) {
            toastError('Could not remove this user.', removeError)
        } finally {
            setRemovingBusy(false)
        }
    }

    const columns: DataTableColumn<Member>[] = [
        {
            key: 'name',
            header: 'Name',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {row.fullName || row.email}
                        </span>
                        {row.userId === currentUserId && (
                            <Tag className="border-0 bg-primary-subtle text-primary">You</Tag>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 md:hidden">{row.email}</div>
                </div>
            ),
        },
        { key: 'email', header: 'Email', cell: (row) => row.email, hideBelow: 'md' },
        { key: 'role', header: 'Role', cell: (row) => ROLE_LABELS[row.role] },
        { key: 'status', header: 'Status', cell: (row) => <StatusBadge option={MEMBER_STATUS_OPTIONS[row.status]} /> },
        {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (row) => {
                const lockedReason = getLockedReason(row)
                if (lockedReason) {
                    return (
                        <Tooltip title={lockedReason} placement="left">
                            <span className="text-xs text-gray-400 dark:text-gray-500">No changes</span>
                        </Tooltip>
                    )
                }
                return (
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {row.status === 'invited' && (
                            <Tooltip title="Send the invitation email again" placement="left">
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<EmailIcon />}
                                    aria-label="Resend invitation"
                                    loading={resendingId === row.id}
                                    onClick={() => onResend(row)}
                                />
                            </Tooltip>
                        )}
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<EditIcon />}
                            aria-label="Edit"
                            onClick={() => setEditing(row)}
                        />
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<DeleteIcon />}
                            aria-label="Remove"
                            className="hover:text-error"
                            onClick={() => setRemoving(row)}
                        />
                    </div>
                )
            },
        },
    ]

    return (
        <>
            <PageHeader
                title="Users & roles"
                description="People who can sign in to this business. Give each person the least access they need."
                actions={
                    <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setInviting(true)}>
                        Invite user
                    </Button>
                }
            />
            <Alert type="info" showIcon duration={0} className="mb-4">
                <span className="font-normal">
                    Each person must use their own account — never share a sign-in. BIR requires every invoice and
                    change to record the user who made it.
                </span>
            </Alert>
            <div className="flex flex-col gap-4">
                <Card>
                    <DataTable
                        columns={columns}
                        records={members}
                        rowKey={(row) => row.id}
                        loading={loading}
                        error={error}
                        onRowClick={(row) => !getLockedReason(row) && setEditing(row)}
                        empty={
                            <EmptyState
                                icon={<UsersNavIcon />}
                                title="No other users yet"
                                description="Invite your accountant or staff so each person signs in with their own account."
                            />
                        }
                    />
                </Card>
                <RolesExplainer />
            </div>

            <InviteMemberDialog
                isOpen={inviting}
                roles={grantableRoles}
                onClose={() => setInviting(false)}
                onSaved={() => {
                    setInviting(false)
                    refresh()
                }}
            />
            <EditMemberDialog
                member={editing}
                roles={grantableRoles}
                onClose={() => setEditing(null)}
                onSaved={() => {
                    setEditing(null)
                    refresh()
                }}
            />
            <ConfirmDialog
                isOpen={!!removing}
                type="danger"
                title="Remove this user?"
                confirmText="Remove"
                onClose={() => setRemoving(null)}
                onConfirm={onRemove}
                closable={!removingBusy}
                confirmButtonProps={{ loading: removingBusy }}
            >
                <strong>{removing?.fullName || removing?.email}</strong> will no longer be able to open this business.
                Invoices and records they created stay in the audit trail.
            </ConfirmDialog>
        </>
    )
}
