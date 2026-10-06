import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getOrganization, updateOrganization } from '@/server/data/organizations'
import { OrganizationSettingsFormSchema } from '@/@types/organizations/forms/OrganizationFormData'
import { ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

/** The current organization's taxpayer profile. */
export const GET = apiAuthHandler(async (_req, _ctx, { supabase, organizationId }) =>
    getJsonResponse(await getOrganization(supabase, organizationId)),
)

export const PUT = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const payload = await parseJsonBody(req, OrganizationSettingsFormSchema)
        return getJsonResponse(await updateOrganization(supabase, organizationId, payload))
    },
    { action: ACTION_SETTINGS_MANAGE },
)
