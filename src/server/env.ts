import 'server-only'

// Server-only configuration. Never import this from client components.

/** Supabase secret (service role) key — bypasses row-level security. Used only for admin tasks. */
export const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * EIS transmission provider:
 * - `mock`: simulates the BIR EIS inside the app (development and test environments; nothing is sent)
 * - `bir`: the BIR EIS API, using each organization's EIS connection (Compliance → EIS Transmissions)
 */
export const eisProvider = (process.env.EIS_PROVIDER || 'mock') as 'mock' | 'bir'
/**
 * Encrypts EIS passwords, application keys, signing keys and session keys at rest. 32 random bytes in
 * base64 (`openssl rand -base64 32`). Changing it makes saved EIS connections unreadable (re-enter them).
 */
export const eisCredentialsKey = process.env.EIS_CREDENTIALS_KEY || ''
/** Override for the EIS public key used by the Authentication API (defaults to the published key). */
export const eisPublicKeyOverride = process.env.EIS_PUBLIC_KEY || ''
export const eisTimeoutMs = Number(process.env.EIS_TIMEOUT_MS || 30000)

/** Shared secret for the scheduled transmission job (Authorization: Bearer <secret>). */
export const cronSecret = process.env.CRON_SECRET || ''

/** Days before a password must be changed (CAS security standard, RMC 5-2021 Annex B: 30). */
export const passwordMaxAgeDays = Number(process.env.PASSWORD_MAX_AGE_DAYS || 30)
