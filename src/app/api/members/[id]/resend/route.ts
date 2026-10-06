import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { resendInvitation } from '@/server/data/members'
import { ACTION_USER_MANAGE } from '@/constants/actions.constant'

/** Sends the invitation email again (or a password-reset link for an account that already exists). */
export const POST = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId, user, role }) => {
        const { id } = await ctx.params
        const result = await resendInvitation(
            supabase,
            organizationId,
            { id: user.id, role, fullName: user.fullName },
            id,
        )
        return getJsonResponse(result)
    },
    { action: ACTION_USER_MANAGE },
)
