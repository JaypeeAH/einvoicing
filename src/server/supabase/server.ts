import 'server-only'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '@/configs/supabase.config'

/**
 * Supabase client acting as the signed-in user (row-level security applies). Use this for every data
 * access so the database enforces tenant isolation and role permissions.
 */
export const createServerSupabase = async () => {
    if (!isSupabaseConfigured) {
        throw new Error(
            'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see docs/SUPABASE-SETUP.md).',
        )
    }
    const cookieStore = await cookies()
    return createServerClient(supabaseUrl, supabasePublishableKey, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet) => {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                } catch {
                    // Called from a Server Component, where cookies are read-only. The proxy refreshes the
                    // session cookie on the next request, so this is safe to ignore.
                }
            },
        },
    })
}

export type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>
