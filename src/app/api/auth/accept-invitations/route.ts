import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'

/**
 * Activates the signed-in user's pending invitations. The email-link route does this already; this exists
 * for links that start the session in the browser instead (see AuthHashHandler).
 */
export const POST = apiAuthHandler(
    async (_req, _ctx, { supabase }) => {
        const { data, error } = await supabase.rpc('accept_invitations')
        if (error) throw error
        return getJsonResponse({ accepted: Number(data ?? 0) })
    },
    { requireOrganization: false },
)
