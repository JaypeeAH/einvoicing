import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { updateSeries } from '@/server/data/series'
import { DocumentSeriesFormSchema } from '@/@types/series/forms/DocumentSeriesFormData'
import { ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

export const PUT = apiAuthHandler<{ id: string }>(
    async (req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        const payload = await parseJsonBody(req, DocumentSeriesFormSchema)
        return getJsonResponse(await updateSeries(supabase, organizationId, id, payload))
    },
    { action: ACTION_SETTINGS_MANAGE },
)
