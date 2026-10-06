import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getDashboardSummary } from '@/server/data/reports'
import { ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

export const GET = apiAuthHandler(
    async (_req, _ctx, { supabase, organizationId }) =>
        getJsonResponse(await getDashboardSummary(supabase, organizationId)),
    { action: ACTION_INVOICE_VIEW },
)
