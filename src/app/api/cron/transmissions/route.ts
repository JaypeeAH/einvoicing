import 'server-only'

import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { apiHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createAdminSupabase } from '@/server/supabase/admin'
import { listOrganizationsWithEisWork, runEisTransmissions, type EisRunSummary } from '@/server/data/transmissions'
import { cronSecret } from '@/server/env'
import { UnauthorizedError } from '@/@types/errors'

const isAuthorized = (req: NextRequest) => {
    const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    if (!cronSecret || provided.length !== cronSecret.length) return false
    return timingSafeEqual(Buffer.from(provided), Buffer.from(cronSecret))
}

export const maxDuration = 300

/**
 * Scheduled job: sends every organization's pending e-invoices to the EIS so they reach BIR within the
 * 3-day window, and collects BIR's processing results. Call it every 5–15 minutes with
 * `Authorization: Bearer $CRON_SECRET` (Vercel Cron, Supabase pg_cron + pg_net, or any scheduler). In
 * production the calls must leave from an IP address whitelisted on the EIS Certification portal.
 */
export const GET = apiHandler(async (req: NextRequest) => {
    if (!isAuthorized(req)) throw new UnauthorizedError('Invalid cron secret.')

    const admin = createAdminSupabase()
    const organizations = await listOrganizationsWithEisWork(admin)
    const results: Record<string, EisRunSummary | { error: string }> = {}
    for (const organizationId of organizations) {
        try {
            results[organizationId] = await runEisTransmissions(admin, organizationId)
        } catch (error) {
            // One organization's problem must not stop the others
            results[organizationId] = { error: error instanceof Error ? error.message : 'Unexpected error' }
        }
    }
    return getJsonResponse({ organizations: organizations.length, results })
})
