import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import { createAdminSupabase } from '@/server/supabase/admin'
import { appUrl } from '@/configs/app.config'
import { DataError, ForbiddenError } from '@/@types/errors'
import type { Member } from '@/@types/members/Member'
import type { InviteMemberFormData, UpdateMemberFormData } from '@/@types/members/forms/MemberFormData'
import type { Role } from '@/constants/roles.constant'

interface MemberRow {
    id: string
    organization_id: string
    user_id: string
    email: string
    full_name: string
    role: Role
    status: Member['status']
    created_at: string
    updated_at: string
}

const toMember = (row: MemberRow): Member => ({
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
})

export const listMembers = async (supabase: ServerSupabase, organizationId: string) => {
    const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('full_name')
        .returns<MemberRow[]>()
    if (error) throw error
    return data.map(toMember)
}

/** Display names for user ids (issued by, voided by, ...). */
export const getMemberNames = async (supabase: ServerSupabase, organizationId: string, userIds: string[]) => {
    const names = new Map<string, string>()
    const ids = [...new Set(userIds)]
    if (ids.length === 0) return names
    const { data, error } = await supabase
        .from('organization_members')
        .select('user_id, full_name, email')
        .eq('organization_id', organizationId)
        .in('user_id', ids)
        .returns<{ user_id: string; full_name: string; email: string }[]>()
    if (error) throw error
    data.forEach((row) => names.set(row.user_id, row.full_name || row.email))
    return names
}

/**
 * Invites a person by email. New users get a Supabase invitation email and become active when they
 * follow the link; existing users are added straight away. Only owners can grant the owner role.
 */
export const inviteMember = async (
    supabase: ServerSupabase,
    organizationId: string,
    actor: { id: string; role: Role },
    payload: InviteMemberFormData,
) => {
    if (payload.role === 'owner' && actor.role !== 'owner') {
        throw new ForbiddenError('Only an owner can invite another owner.')
    }

    const admin = createAdminSupabase()
    const { data: existing } = await admin
        .from('profiles')
        .select('id, full_name')
        .eq('email', payload.email)
        .maybeSingle<{ id: string; full_name: string }>()

    let userId = existing?.id
    let status: Member['status'] = 'active'

    if (!userId) {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(payload.email, {
            data: { full_name: payload.fullName },
            redirectTo: `${appUrl}/auth/callback?next=/account/password`,
        })
        if (error) throw new DataError(error.message)
        userId = data.user.id
        status = 'invited'
    }

    const { data, error } = await supabase
        .from('organization_members')
        .insert({
            organization_id: organizationId,
            user_id: userId,
            role: payload.role,
            status,
            email: payload.email,
            full_name: existing?.full_name || payload.fullName,
            invited_by: actor.id,
        })
        .select('*')
        .single<MemberRow>()
    if (error) {
        if (error.code === '23505') throw new DataError('This person is already a member of your organization.')
        throw error
    }
    return toMember(data)
}

export const updateMember = async (
    supabase: ServerSupabase,
    organizationId: string,
    actor: { id: string; role: Role },
    memberId: string,
    payload: UpdateMemberFormData,
) => {
    const { data: current, error: readError } = await supabase
        .from('organization_members')
        .select('user_id, status, role')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single<{ user_id: string; status: Member['status']; role: Role }>()
    if (readError) throw readError
    if (current.user_id === actor.id) {
        throw new DataError('You cannot change your own role or access. Ask another owner or administrator.')
    }
    if ((current.role === 'owner' || payload.role === 'owner') && actor.role !== 'owner') {
        throw new ForbiddenError('Only an owner can grant or change owner access.')
    }

    const { data, error } = await supabase
        .from('organization_members')
        // An invited person stays invited until they accept; suspending always applies
        .update({
            role: payload.role,
            status: current.status === 'invited' && payload.status === 'active' ? 'invited' : payload.status,
        })
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .select('*')
        .single<MemberRow>()
    if (error) throw error
    return toMember(data)
}

export const removeMember = async (
    supabase: ServerSupabase,
    organizationId: string,
    actor: { id: string; role: Role },
    memberId: string,
) => {
    const { data: current, error: readError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single<{ role: Role }>()
    if (readError) throw readError
    if (current.role === 'owner' && actor.role !== 'owner') {
        throw new ForbiddenError('Only an owner can remove another owner.')
    }

    const { data, error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .neq('user_id', actor.id)
        .select('id')
    if (error) throw error
    if (!data?.length) throw new DataError('You cannot remove yourself.')
}
