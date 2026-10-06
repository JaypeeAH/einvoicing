import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteDocument, getDocumentDownloadUrl } from '@/server/data/documents'
import { ACTION_COMPLIANCE_VIEW, ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

/** Returns a 60-second signed download URL. */
export const GET = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        return getJsonResponse({ url: await getDocumentDownloadUrl(supabase, organizationId, id) })
    },
    { action: ACTION_COMPLIANCE_VIEW },
)

export const DELETE = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        await deleteDocument(supabase, organizationId, id)
        return getEmptyResponse()
    },
    { action: ACTION_SETTINGS_MANAGE },
)
