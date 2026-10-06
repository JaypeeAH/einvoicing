import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getComplianceStatus } from '@/server/data/compliance'
import { ACTION_COMPLIANCE_VIEW } from '@/constants/actions.constant'

export const GET = apiAuthHandler(
    async (_req, _ctx, { supabase, organizationId }) =>
        getJsonResponse(await getComplianceStatus(supabase, organizationId)),
    { action: ACTION_COMPLIANCE_VIEW },
)
