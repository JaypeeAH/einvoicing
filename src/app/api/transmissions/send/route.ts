import 'server-only'

import { z } from 'zod'
import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { transmitOne, transmitPending } from '@/server/data/transmissions'
import { ACTION_COMPLIANCE_MANAGE } from '@/constants/actions.constant'

const SendSchema = z.object({ transmissionId: z.string().uuid().optional() })

/** Sends one transmission (retry) or every pending one now. */
export const POST = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const { transmissionId } = await parseJsonBody(req, SendSchema)
        if (transmissionId) {
            return getJsonResponse({ status: await transmitOne(supabase, organizationId, transmissionId) })
        }
        return getJsonResponse(await transmitPending(supabase, organizationId))
    },
    { action: ACTION_COMPLIANCE_MANAGE },
)
