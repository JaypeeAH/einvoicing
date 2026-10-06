import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createSeries, listSeries } from '@/server/data/series'
import { DocumentSeriesFormSchema } from '@/@types/series/forms/DocumentSeriesFormData'
import { ACTION_INVOICE_VIEW, ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

export const GET = apiAuthHandler(
    async (_req, _ctx, { supabase, organizationId }) => getJsonResponse(await listSeries(supabase, organizationId)),
    { action: ACTION_INVOICE_VIEW },
)

export const POST = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const payload = await parseJsonBody(req, DocumentSeriesFormSchema)
        return getJsonResponse(await createSeries(supabase, organizationId, payload), { status: 201 })
    },
    { action: ACTION_SETTINGS_MANAGE },
)
