import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createBranch, listBranches } from '@/server/data/branches'
import { BranchFormSchema } from '@/@types/branches/forms/BranchFormData'
import { ACTION_INVOICE_VIEW, ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

export const GET = apiAuthHandler(
    async (_req, _ctx, { supabase, organizationId }) => getJsonResponse(await listBranches(supabase, organizationId)),
    { action: ACTION_INVOICE_VIEW },
)

export const POST = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const payload = await parseJsonBody(req, BranchFormSchema)
        return getJsonResponse(await createBranch(supabase, organizationId, payload), { status: 201 })
    },
    { action: ACTION_SETTINGS_MANAGE },
)
