import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import type { Member } from '@/@types/members/Member'
import type { InviteMemberFormData, UpdateMemberFormData } from '@/@types/members/forms/MemberFormData'

const membersPath = '/members'

export const apiInviteMember = (data: InviteMemberFormData) =>
    api.fetchJson<Member>({ method: 'post', url: membersPath, data })

export const apiUpdateMember = (memberId: string, data: UpdateMemberFormData) =>
    api.fetchJson<Member>({ method: 'put', url: `${membersPath}/${memberId}`, data })

/** Sends the invitation email again. Returns whether an invite or a reset link was sent. */
export const apiResendInvitation = (memberId: string) =>
    api.fetchJson<{ email: string; kind: 'invite' | 'reset' }>({
        method: 'post',
        url: `${membersPath}/${memberId}/resend`,
    })

/**
 * Creates a one-time invitation link without sending an email (for when the sender is rate limited).
 * Treat the link like a password: anyone holding it can set this person's password.
 */
export const apiCreateInvitationLink = (memberId: string) =>
    api.fetchJson<{ email: string; kind: 'invite' | 'recovery'; url: string }>({
        method: 'post',
        url: `${membersPath}/${memberId}/invite-link`,
    })

export const apiRemoveMember = (memberId: string) =>
    api.fetchJson<void>({ method: 'delete', url: `${membersPath}/${memberId}` })

export const useSWRMembers = (config?: SWRConfiguration<Member[]>) =>
    useSWR(membersPath, (url: string) => api.fetchJson<Member[]>({ method: 'get', url }), config)
