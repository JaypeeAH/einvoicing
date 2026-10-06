import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { issueInvoice } from '@/server/data/invoices'
import { ACTION_INVOICE_ISSUE } from '@/constants/actions.constant'

/** Issues a draft: assigns the serial number and locks the document. */
export const POST = apiAuthHandler<{ id: string }>(
    async (_req, ctx, session) => {
        const { id } = await ctx.params
        return getJsonResponse(await issueInvoice(session, id))
    },
    { action: ACTION_INVOICE_ISSUE },
)
