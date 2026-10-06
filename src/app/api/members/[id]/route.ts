import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { removeMember, updateMember } from '@/server/data/members'
import { UpdateMemberFormSchema } from '@/@types/members/forms/MemberFormData'
import { ACTION_USER_MANAGE } from '@/constants/actions.constant'

export const PUT = apiAuthHandler<{ id: string }>(
    async (req, ctx, { supabase, organizationId, user, role }) => {
        const { id } = await ctx.params
        const payload = await parseJsonBody(req, UpdateMemberFormSchema)
        return getJsonResponse(await updateMember(supabase, organizationId, { id: user.id, role }, id, payload))
    },
    { action: ACTION_USER_MANAGE },
)

export const DELETE = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId, user, role }) => {
        const { id } = await ctx.params
        await removeMember(supabase, organizationId, { id: user.id, role }, id)
        return getEmptyResponse()
    },
    { action: ACTION_USER_MANAGE },
)
