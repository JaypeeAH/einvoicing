import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteCustomer, getCustomer, updateCustomer } from '@/server/data/customers'
import { CustomerFormSchema } from '@/@types/customers/forms/CustomerFormData'
import { ACTION_CUSTOMER_DELETE, ACTION_CUSTOMER_MANAGE, ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

export const GET = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        return getJsonResponse(await getCustomer(supabase, organizationId, id))
    },
    { action: ACTION_INVOICE_VIEW },
)

export const PUT = apiAuthHandler<{ id: string }>(
    async (req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        const payload = await parseJsonBody(req, CustomerFormSchema)
        return getJsonResponse(await updateCustomer(supabase, organizationId, id, payload))
    },
    { action: ACTION_CUSTOMER_MANAGE },
)

export const DELETE = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        await deleteCustomer(supabase, organizationId, id)
        return getEmptyResponse()
    },
    { action: ACTION_CUSTOMER_DELETE },
)
