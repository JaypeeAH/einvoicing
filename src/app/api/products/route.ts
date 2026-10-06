import 'server-only'

import { apiAuthHandler, getPaging, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createProduct, listProducts } from '@/server/data/products'
import { ProductFormSchema } from '@/@types/products/forms/ProductFormData'
import { ACTION_INVOICE_VIEW, ACTION_PRODUCT_MANAGE } from '@/constants/actions.constant'

export const GET = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const { searchParams } = new URL(req.url)
        const active = searchParams.get('active')
        const result = await listProducts(supabase, organizationId, {
            ...getPaging(searchParams),
            query: searchParams.get('query') || undefined,
            active: active === null ? undefined : active === 'true',
        })
        return getJsonResponse(result)
    },
    { action: ACTION_INVOICE_VIEW },
)

export const POST = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const payload = await parseJsonBody(req, ProductFormSchema)
        return getJsonResponse(await createProduct(supabase, organizationId, payload), { status: 201 })
    },
    { action: ACTION_PRODUCT_MANAGE },
)
