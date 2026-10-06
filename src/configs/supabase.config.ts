// Public Supabase settings (safe in the browser — row-level security protects the data).
// Server-only secrets live in src/server/env.ts.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/** The publishable (anon) key. Supabase's newer `sb_publishable_…` keys and legacy anon JWTs both work. */
export const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

/** Private Storage bucket for compliance documents (created by the initial migration). */
export const complianceDocumentsBucket = 'compliance-documents'
