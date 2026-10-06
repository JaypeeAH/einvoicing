import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { voidInvoice } from '@/server/data/invoices'
import { VoidInvoiceFormSchema } from '@/@types/invoices/forms/InvoiceFormData'
import { ACTION_INVOICE_VOID } from '@/constants/actions.constant'

/** Voids an issued document (it keeps its number; a reason is required). */
export const POST = apiAuthHandler<{ id: string }>(
    async (req, ctx, session) => {
        const { id } = await ctx.params
        const { reason } = await parseJsonBody(req, VoidInvoiceFormSchema)
        return getJsonResponse(await voidInvoice(session, id, reason))
    },
    { action: ACTION_INVOICE_VOID },
)
