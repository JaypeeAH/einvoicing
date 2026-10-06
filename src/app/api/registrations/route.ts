import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createRegistration, listRegistrations } from '@/server/data/registrations'
import { RegistrationFormSchema } from '@/@types/registrations/forms/RegistrationFormData'
import { ACTION_COMPLIANCE_MANAGE, ACTION_COMPLIANCE_VIEW } from '@/constants/actions.constant'

export const GET = apiAuthHandler(
    async (_req, _ctx, { supabase, organizationId }) =>
        getJsonResponse(await listRegistrations(supabase, organizationId)),
    { action: ACTION_COMPLIANCE_VIEW },
)

export const POST = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const payload = await parseJsonBody(req, RegistrationFormSchema)
        return getJsonResponse(await createRegistration(supabase, organizationId, payload), { status: 201 })
    },
    { action: ACTION_COMPLIANCE_MANAGE },
)
