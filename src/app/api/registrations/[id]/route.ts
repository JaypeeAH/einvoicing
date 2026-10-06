import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteRegistration, updateRegistration } from '@/server/data/registrations'
import { RegistrationFormSchema } from '@/@types/registrations/forms/RegistrationFormData'
import { ACTION_COMPLIANCE_MANAGE, ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

export const PUT = apiAuthHandler<{ id: string }>(
    async (req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        const payload = await parseJsonBody(req, RegistrationFormSchema)
        return getJsonResponse(await updateRegistration(supabase, organizationId, id, payload))
    },
    { action: ACTION_COMPLIANCE_MANAGE },
)

export const DELETE = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        await deleteRegistration(supabase, organizationId, id)
        return getEmptyResponse()
    },
    { action: ACTION_SETTINGS_MANAGE },
)
