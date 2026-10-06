import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createInvitationLink } from '@/server/data/members'
import { ACTION_USER_MANAGE } from '@/constants/actions.constant'

/**
 * Creates a one-time link to the "set your password" page without sending an email — the fallback when the
 * email sender is rate limited or not configured yet.
 */
export const POST = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId, user, role }) => {
        const { id } = await ctx.params
        const result = await createInvitationLink(supabase, organizationId, { id: user.id, role }, id)
        return getJsonResponse(result)
    },
    { action: ACTION_USER_MANAGE },
)
