import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteProduct, updateProduct } from '@/server/data/products'
import { ProductFormSchema } from '@/@types/products/forms/ProductFormData'
import { ACTION_PRODUCT_MANAGE } from '@/constants/actions.constant'

export const PUT = apiAuthHandler<{ id: string }>(
    async (req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        const payload = await parseJsonBody(req, ProductFormSchema)
        return getJsonResponse(await updateProduct(supabase, organizationId, id, payload))
    },
    { action: ACTION_PRODUCT_MANAGE },
)

export const DELETE = apiAuthHandler<{ id: string }>(
    async (_req, ctx, { supabase, organizationId }) => {
        const { id } = await ctx.params
        await deleteProduct(supabase, organizationId, id)
        return getEmptyResponse()
    },
    { action: ACTION_PRODUCT_MANAGE },
)
