import 'server-only'

import type { NextRequest } from 'next/server'
import type { ZodType, ZodTypeDef } from 'zod'
import { createServerSupabase, type ServerSupabase } from '@/server/supabase/server'
import { getServerSessionUser } from '@/server/auth/session'
import { getApiErrorResponse } from '@/server/utils/response'
import { hasAuthorityTo } from '@/utils/hasAuthority'
import { DataError, ForbiddenError, UnauthorizedError } from '@/@types/errors'
import type { Action } from '@/constants/actions.constant'
import type { Role } from '@/constants/roles.constant'
import type { SessionUser } from '@/@types/auth/SessionUser'

export interface ApiRouteContext<P extends Record<string, string> = Record<string, string>> {
    params: Promise<P>
}

/** What an authenticated handler receives: the user, their organization and role, and an RLS client. */
export interface ApiSession {
    user: SessionUser
    organizationId: string
    role: Role
    supabase: ServerSupabase
}

type Handler<P extends Record<string, string>> = (req: NextRequest, ctx: ApiRouteContext<P>) => Promise<Response>

/** Wraps a public handler with consistent error responses. */
export const apiHandler =
    <P extends Record<string, string>>(handler: Handler<P>) =>
    async (req: NextRequest, ctx: ApiRouteContext<P>) => {
        try {
            return await handler(req, ctx)
        } catch (error) {
            return getApiErrorResponse(error)
        }
    }

/**
 * Wraps a handler that needs a signed-in member of an organization. When `action` is given, the user's
 * role must allow it (row-level security enforces the same rules again in the database).
 */
export const apiAuthHandler =
    <P extends Record<string, string> = Record<string, string>>(
        handler: (req: NextRequest, ctx: ApiRouteContext<P>, session: ApiSession) => Promise<Response>,
        options: { action?: Action; requireOrganization?: boolean } = {},
    ) =>
    async (req: NextRequest, ctx: ApiRouteContext<P>) => {
        try {
            const user = await getServerSessionUser()
            if (!user) throw new UnauthorizedError()

            if (options.requireOrganization === false) {
                const supabase = await createServerSupabase()
                return await handler(req, ctx, {
                    user,
                    organizationId: user.organization?.id ?? '',
                    role: user.role ?? 'viewer',
                    supabase,
                })
            }

            if (!user.organization || !user.role) {
                throw new ForbiddenError('Set up your organization before continuing.')
            }
            if (options.action && !hasAuthorityTo(user.role, options.action)) {
                throw new ForbiddenError()
            }

            const supabase = await createServerSupabase()
            return await handler(req, ctx, {
                user,
                organizationId: user.organization.id,
                role: user.role,
                supabase,
            })
        } catch (error) {
            return getApiErrorResponse(error)
        }
    }

/** Throws 403 unless the session's role allows `action`. */
export const requireAuthority = (session: ApiSession, action: Action) => {
    if (!hasAuthorityTo(session.role, action)) throw new ForbiddenError()
}

/** Parses and validates a JSON body. Validation problems are returned as `details: [{ field, message }]`. */
export const parseJsonBody = async <Output, Input = Output>(
    req: NextRequest,
    schema: ZodType<Output, ZodTypeDef, Input>,
): Promise<Output> => {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        throw new DataError('The request body must be valid JSON.')
    }
    const result = schema.safeParse(body)
    if (!result.success) {
        const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
        throw new DataError(details[0]?.message ?? 'Please check the highlighted fields.', details)
    }
    return result.data
}

/** Reads `page` / `size` query parameters with sane bounds, returning a PostgREST range. */
export const getPaging = (searchParams: URLSearchParams, defaultSize = 20) => {
    const page = Math.max(Number(searchParams.get('page')) || 1, 1)
    const size = Math.min(Math.max(Number(searchParams.get('size')) || defaultSize, 1), 200)
    const from = (page - 1) * size
    return { page, size, from, to: from + size - 1 }
}

/** Escapes user search text for a PostgREST `ilike` filter inside `.or()`. */
export const toSearchPattern = (query: string) => `%${query.replace(/[%_,()\\]/g, (char) => `\\${char}`)}%`
