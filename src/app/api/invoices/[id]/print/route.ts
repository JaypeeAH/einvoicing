import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { recordInvoicePrint } from '@/server/data/invoices'
import { ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

/** Records a print. Copies after the first are marked REPRINT. */
export const POST = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase }) => {
        const { id } = await ctx.params
        return getJsonResponse({ copy: await recordInvoicePrint(supabase, id) })
    },
    { action: ACTION_INVOICE_VIEW },
)
