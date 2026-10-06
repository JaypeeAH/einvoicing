import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getEmptyResponse } from '@/server/utils/response'

/** Records that the user changed their password (resets the 30-day rotation clock). */
export const POST = apiAuthHandler(
    async (_req, _ctx, { supabase }) => {
        const { error } = await supabase.rpc('mark_password_changed')
        if (error) throw error
        return getEmptyResponse()
    },
    { requireOrganization: false },
)
