import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createAdminSupabase } from '@/server/supabase/admin'
import { deleteEisConnection, getEisConnectionSummary, saveEisConnection } from '@/server/data/eisConnections'
import { EisConnectionFormSchema } from '@/@types/transmissions/forms/EisConnectionFormData'
import { ACTION_COMPLIANCE_VIEW, ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'

// EIS credentials are stored where only the service role can read them, so these handlers use the admin
// client after the permission check. Secrets are write-only: responses never include them.

export const GET = apiAuthHandler(
    async (_req, _ctx, { organizationId }) =>
        getJsonResponse(await getEisConnectionSummary(createAdminSupabase(), organizationId)),
    { action: ACTION_COMPLIANCE_VIEW },
)

export const PUT = apiAuthHandler(
    async (req, _ctx, { organizationId, user }) => {
        const payload = await parseJsonBody(req, EisConnectionFormSchema)
        return getJsonResponse(await saveEisConnection(createAdminSupabase(), organizationId, user, payload))
    },
    { action: ACTION_SETTINGS_MANAGE },
)

export const DELETE = apiAuthHandler(
    async (_req, _ctx, { organizationId, user }) => {
        const admin = createAdminSupabase()
        await deleteEisConnection(admin, organizationId, user)
        return getJsonResponse(await getEisConnectionSummary(admin, organizationId))
    },
    { action: ACTION_SETTINGS_MANAGE },
)
