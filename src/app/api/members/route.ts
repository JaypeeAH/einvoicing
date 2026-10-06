import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { inviteMember, listMembers } from '@/server/data/members'
import { InviteMemberFormSchema } from '@/@types/members/forms/MemberFormData'
import { ACTION_USER_MANAGE } from '@/constants/actions.constant'

export const GET = apiAuthHandler(
    async (_req, _ctx, { supabase, organizationId }) => getJsonResponse(await listMembers(supabase, organizationId)),
    { action: ACTION_USER_MANAGE },
)

export const POST = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId, user, role }) => {
        const payload = await parseJsonBody(req, InviteMemberFormSchema)
        const member = await inviteMember(
            supabase,
            organizationId,
            { id: user.id, role, fullName: user.fullName },
            payload,
        )
        return getJsonResponse(member, { status: 201 })
    },
    { action: ACTION_USER_MANAGE },
)
