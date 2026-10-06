import 'server-only'

import { apiAuthHandler, getPaging } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { listAuditLogs } from '@/server/data/audit'
import { ACTION_AUDIT_VIEW } from '@/constants/actions.constant'

export const GET = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const { searchParams } = new URL(req.url)
        const result = await listAuditLogs(supabase, organizationId, {
            ...getPaging(searchParams, 50),
            query: searchParams.get('query') || undefined,
            entityType: searchParams.get('entityType') || undefined,
            dateFrom: searchParams.get('dateFrom') || undefined,
            dateTo: searchParams.get('dateTo') || undefined,
        })
        return getJsonResponse(result)
    },
    { action: ACTION_AUDIT_VIEW },
)
