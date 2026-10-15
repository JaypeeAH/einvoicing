import 'server-only'

import { z } from 'zod'
import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createAdminSupabase } from '@/server/supabase/admin'
import { runEisTransmissions } from '@/server/data/transmissions'
import { ACTION_COMPLIANCE_MANAGE } from '@/constants/actions.constant'

const SendSchema = z.object({ transmissionId: z.string().uuid().optional() })

export const maxDuration = 120

/**
 * Sends one transmission (retry, including rejected ones) or every pending one now, and collects due
 * results. Runs with the admin client because EIS credentials are readable only by the server; the
 * permission is checked above and the work is scoped to the user's organization.
 */
export const POST = apiAuthHandler(
    async (req, _ctx, { organizationId }) => {
        const { transmissionId } = await parseJsonBody(req, SendSchema)
        return getJsonResponse(await runEisTransmissions(createAdminSupabase(), organizationId, { transmissionId }))
    },
    { action: ACTION_COMPLIANCE_MANAGE },
)
