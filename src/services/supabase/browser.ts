'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabasePublishableKey, supabaseUrl } from '@/configs/supabase.config'

let client: ReturnType<typeof createBrowserClient> | undefined

/**
 * Browser Supabase client. Used only for authentication (sign in, sign up, password reset), which stores
 * the session in cookies the server reads. All data goes through the API (src/services/api.ts).
 */
export const getBrowserSupabase = () => {
    if (!client) {
        client = createBrowserClient(supabaseUrl, supabasePublishableKey)
    }
    return client
}
