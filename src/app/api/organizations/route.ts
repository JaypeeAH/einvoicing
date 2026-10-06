import 'server-only'

import { cookies } from 'next/headers'
import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createOrganization } from '@/server/data/organizations'
import { OrganizationFormSchema } from '@/@types/organizations/forms/OrganizationFormData'
import { ORGANIZATION_COOKIE } from '@/constants/app.constant'

/** Onboarding: registers a new taxpayer organization and switches to it. */
export const POST = apiAuthHandler(
    async (req, _ctx, { supabase }) => {
        const payload = await parseJsonBody(req, OrganizationFormSchema)
        const organizationId = await createOrganization(supabase, payload)
        ;(await cookies()).set(ORGANIZATION_COOKIE, organizationId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
        })
        return getJsonResponse({ id: organizationId }, { status: 201 })
    },
    { requireOrganization: false },
)
