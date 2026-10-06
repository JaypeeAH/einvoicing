import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import { createAdminSupabase } from '@/server/supabase/admin'
import { appUrl, setPasswordPath } from '@/configs/app.config'
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

/** Supabase's built-in sender allows only a few emails an hour; say so in plain language. */
const isEmailRateLimited = (message: string) => /rate limit|too many requests/i.test(message)

const EMAIL_RATE_LIMIT_MESSAGE =
    'The email sender has reached its hourly limit. Use “Copy invitation link” and send the link yourself, or set up your own SMTP sender in Supabase to lift the limit.'

/** Where invitation and reset links come back to; the callback sends the visitor on to set a password. */
const getInviteRedirectTo = () => `${appUrl}/auth/callback?next=${setPasswordPath}`

const getOrganizationName = async (supabase: ServerSupabase, organizationId: string) => {
    const { data } = await supabase
        .from('organizations')
        .select('registered_name, business_name')
        .eq('id', organizationId)
        .maybeSingle<{ registered_name: string; business_name: string | null }>()
    return data?.business_name || data?.registered_name || ''
}

/**
 * Invites a person by email. New users get a Supabase invitation email and become active when they
 * follow the link; existing users are added straight away. Only owners can grant the owner role.
 */
export const inviteMember = async (
    supabase: ServerSupabase,
    organizationId: string,
    actor: { id: string; role: Role; fullName: string },
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
            // Shown in the invitation email template
            data: {
                full_name: payload.fullName,
                organization_name: await getOrganizationName(supabase, organizationId),
                invited_by_name: actor.fullName,
            },
            redirectTo: getInviteRedirectTo(),
        })
        if (error) {
            throw new DataError(isEmailRateLimited(error.message) ? EMAIL_RATE_LIMIT_MESSAGE : error.message)
        }
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

/**
 * Sends the invitation email again. People who already finished signing up get a password-reset link
 * instead, which lands on the same "set your password" page.
 */
export const resendInvitation = async (
    supabase: ServerSupabase,
    organizationId: string,
    actor: { id: string; role: Role; fullName: string },
    memberId: string,
) => {
    const { data: member, error } = await supabase
        .from('organization_members')
        .select('email, full_name, role, status')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single<{ email: string; full_name: string; role: Role; status: Member['status'] }>()
    if (error) throw error
    if (member.status === 'suspended') {
        throw new DataError('This person is suspended. Restore their access before sending an invitation.')
    }
    if (member.role === 'owner' && actor.role !== 'owner') {
        throw new ForbiddenError('Only an owner can send an invitation to another owner.')
    }

    const admin = createAdminSupabase()
    const invite = await admin.auth.admin.inviteUserByEmail(member.email, {
        data: {
            full_name: member.full_name,
            organization_name: await getOrganizationName(supabase, organizationId),
            invited_by_name: actor.fullName,
        },
        redirectTo: getInviteRedirectTo(),
    })

    if (invite.error) {
        // Already has a usable account: a reset link gets them to the same place
        const { error: resetError } = await admin.auth.resetPasswordForEmail(member.email, {
            redirectTo: getInviteRedirectTo(),
        })
        if (resetError) {
            throw new DataError(isEmailRateLimited(resetError.message) ? EMAIL_RATE_LIMIT_MESSAGE : resetError.message)
        }
        return { email: member.email, kind: 'reset' as const }
    }
    return { email: member.email, kind: 'invite' as const }
}

/**
 * Builds a one-time link to the "set your password" page without sending an email. Use it when the email
 * sender is rate limited or unavailable: the owner passes the link to the person directly.
 */
export const createInvitationLink = async (
    supabase: ServerSupabase,
    organizationId: string,
    actor: { id: string; role: Role },
    memberId: string,
) => {
    const { data: member, error } = await supabase
        .from('organization_members')
        .select('email, role, status')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single<{ email: string; role: Role; status: Member['status'] }>()
    if (error) throw error
    if (member.status === 'suspended') {
        throw new DataError('This person is suspended. Restore their access before creating a link.')
    }
    if (member.role === 'owner' && actor.role !== 'owner') {
        throw new ForbiddenError('Only an owner can create a link for another owner.')
    }

    const admin = createAdminSupabase()
    const redirectTo = getInviteRedirectTo()

    // `invite` only works for an address with no account yet; everyone else gets a password-reset link
    let kind: 'invite' | 'recovery' = 'invite'
    let generated = await admin.auth.admin.generateLink({
        type: 'invite',
        email: member.email,
        options: { redirectTo },
    })
    if (generated.error) {
        kind = 'recovery'
        generated = await admin.auth.admin.generateLink({
            type: 'recovery',
            email: member.email,
            options: { redirectTo },
        })
    }
    if (generated.error) throw new DataError(generated.error.message)

    const tokenHash = generated.data.properties?.hashed_token
    if (!tokenHash) throw new DataError('Could not create an invitation link. Please try again.')

    return {
        email: member.email,
        kind,
        url: `${appUrl}/auth/callback?token_hash=${tokenHash}&type=${kind}&next=${setPasswordPath}`,
    }
}
