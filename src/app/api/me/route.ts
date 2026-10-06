import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'

/** The signed-in user, their memberships and current organization. */
export const GET = apiAuthHandler(async (_req, _ctx, { user }) => getJsonResponse(user), { requireOrganization: false })
