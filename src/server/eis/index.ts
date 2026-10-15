import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { eisProvider } from '@/server/env'
import { loadEisConnection } from '@/server/data/eisConnections'
import { BirEisGateway } from './BirEisGateway'
import { MockEisGateway } from './MockEisGateway'
import type { EisGateway } from './types'

/**
 * The organization's EIS gateway: the simulation when `EIS_PROVIDER=mock`, otherwise the BIR EIS with the
 * organization's saved connection (null when it has not been set up yet).
 */
export const getEisGateway = async (admin: SupabaseClient, organizationId: string): Promise<EisGateway | null> => {
    if (eisProvider !== 'bir') return new MockEisGateway()
    const loaded = await loadEisConnection(admin, organizationId)
    return loaded ? new BirEisGateway(loaded.connection, loaded.sessions) : null
}
