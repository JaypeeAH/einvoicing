import 'server-only'

import { apiAuthHandler, getPaging } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { listTransmissions } from '@/server/data/transmissions'
import { ACTION_COMPLIANCE_VIEW } from '@/constants/actions.constant'
import { TRANSMISSION_STATUSES, type TransmissionStatus } from '@/constants/bir.constant'

export const GET = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const result = await listTransmissions(supabase, organizationId, {
            ...getPaging(searchParams),
            status:
                status && (TRANSMISSION_STATUSES as readonly string[]).includes(status)
                    ? (status as TransmissionStatus)
                    : undefined,
        })
        return getJsonResponse(result)
    },
    { action: ACTION_COMPLIANCE_VIEW },
)
