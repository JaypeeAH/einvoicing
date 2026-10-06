import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteInvoiceDraft, getInvoiceDetails, saveInvoiceDraft } from '@/server/data/invoices'
import { InvoiceFormSchema } from '@/@types/invoices/forms/InvoiceFormData'
import { ACTION_INVOICE_ISSUE, ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

export const GET = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        return getJsonResponse(await getInvoiceDetails(supabase, organizationId, id))
    },
    { action: ACTION_INVOICE_VIEW },
)

/** Updates a draft (issued documents are immutable). */
export const PUT = apiAuthHandler<{ id: string }>(
    async (req, ctx, session) => {
        const { id } = await ctx.params
        const payload = await parseJsonBody(req, InvoiceFormSchema)
        return getJsonResponse(await saveInvoiceDraft(session, payload, id))
    },
    { action: ACTION_INVOICE_ISSUE },
)

export const DELETE = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        await deleteInvoiceDraft(supabase, organizationId, id)
        return getEmptyResponse()
    },
    { action: ACTION_INVOICE_ISSUE },
)
