import 'server-only'

import { cookies } from 'next/headers'
import { z } from 'zod'
import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getEmptyResponse } from '@/server/utils/response'
import { ORGANIZATION_COOKIE } from '@/constants/app.constant'
import { ForbiddenError } from '@/@types/errors'

const SwitchSchema = z.object({ organizationId: z.string().uuid() })

/** Switches the organization the user works in (must be an active membership). */
export const POST = apiAuthHandler(
    async (req, _ctx, { user }) => {
        const { organizationId } = await parseJsonBody(req, SwitchSchema)
        if (!user.memberships.some((membership) => membership.organization.id === organizationId)) {
            throw new ForbiddenError('You are not a member of that organization.')
        }
        ;(await cookies()).set(ORGANIZATION_COOKIE, organizationId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
        })
        return getEmptyResponse()
    },
    { requireOrganization: false },
)
