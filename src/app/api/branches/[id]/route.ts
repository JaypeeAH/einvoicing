import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { updateBranch } from '@/server/data/branches'
import { BranchFormSchema } from '@/@types/branches/forms/BranchFormData'
import { ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

export const PUT = apiAuthHandler<{ id: string }>(
    async (req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        const payload = await parseJsonBody(req, BranchFormSchema)
        return getJsonResponse(await updateBranch(supabase, organizationId, id, payload))
    },
    { action: ACTION_SETTINGS_MANAGE },
)
