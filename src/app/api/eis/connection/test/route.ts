import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createAdminSupabase } from '@/server/supabase/admin'
import { testEisConnection } from '@/server/data/eisConnections'
import { ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

/** Calls the EIS Authentication API with the saved credentials (EIS certification test steps 1–2). */
export const POST = apiAuthHandler(
    async (_req, _ctx, { organizationId, user }) =>
        getJsonResponse(await testEisConnection(createAdminSupabase(), organizationId, user)),
    { action: ACTION_SETTINGS_MANAGE },
)
