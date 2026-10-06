import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { supabaseUrl } from '@/configs/supabase.config'
import { supabaseSecretKey } from '@/server/env'

/**
 * Supabase client with the secret (service role) key. It BYPASSES row-level security, so only use it for
 * tasks a user session cannot do (inviting users, the scheduled EIS transmission job) and always check
 * permissions in code first.
 */
export const createAdminSupabase = () => {
    if (!supabaseSecretKey) {
        throw new Error('SUPABASE_SECRET_KEY is not configured.')
    }
    return createClient(supabaseUrl, supabaseSecretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}
