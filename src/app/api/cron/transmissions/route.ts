import 'server-only'

import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { apiHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createAdminSupabase } from '@/server/supabase/admin'
import { transmitPending } from '@/server/data/transmissions'
import { cronSecret } from '@/server/env'
import { UnauthorizedError } from '@/@types/errors'

const isAuthorized = (req: NextRequest) => {
    const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    if (!cronSecret || provided.length !== cronSecret.length) return false
    return timingSafeEqual(Buffer.from(provided), Buffer.from(cronSecret))
}

/**
 * Scheduled job: sends every organization's pending EIS transmissions so invoices reach BIR within the
 * 3-day window. Call it every 15–60 minutes with `Authorization: Bearer $CRON_SECRET`
 * (e.g. Vercel Cron, Supabase pg_cron + pg_net, or any scheduler).
 */
export const GET = apiHandler(async (req: NextRequest) => {
    if (!isAuthorized(req)) throw new UnauthorizedError('Invalid cron secret.')

    const admin = createAdminSupabase()
    const { data, error } = await admin
        .from('eis_transmissions')
        .select('organization_id')
        .in('status', ['queued', 'failed'])
        .returns<{ organization_id: string }[]>()
    if (error) throw error

    const organizations = [...new Set(data.map((row) => row.organization_id))]
    const results: Record<string, Awaited<ReturnType<typeof transmitPending>>> = {}
    for (const organizationId of organizations) {
        results[organizationId] = await transmitPending(admin, organizationId)
    }
    return getJsonResponse({ organizations: organizations.length, results })
})
