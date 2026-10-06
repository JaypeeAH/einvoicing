import 'server-only'

import { apiAuthHandler, getPaging, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createCustomer, listCustomers } from '@/server/data/customers'
import { CustomerFormSchema } from '@/@types/customers/forms/CustomerFormData'
import { ACTION_CUSTOMER_MANAGE, ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

export const GET = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const { searchParams } = new URL(req.url)
        const active = searchParams.get('active')
        const result = await listCustomers(supabase, organizationId, {
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
        const payload = await parseJsonBody(req, CustomerFormSchema)
        return getJsonResponse(await createCustomer(supabase, organizationId, payload), { status: 201 })
    },
    { action: ACTION_CUSTOMER_MANAGE },
)
