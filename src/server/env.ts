import 'server-only'

// Server-only configuration. Never import this from client components.

/** Supabase secret (service role) key — bypasses row-level security. Used only for admin tasks. */
export const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * EIS transmission provider:
 * - `mock`: simulates BIR responses (development and test environments)
 * - `bir`: the BIR EIS API — requires the credentials issued to the taxpayer during EIS certification
 */
export const eisProvider = (process.env.EIS_PROVIDER || 'mock') as 'mock' | 'bir'
export const eisBaseUrl = process.env.EIS_BASE_URL || ''
export const eisApplicationId = process.env.EIS_APPLICATION_ID || ''
export const eisApplicationSecret = process.env.EIS_APPLICATION_SECRET || ''
/** PEM private key used to sign (JWS) payloads; the matching public key is registered with BIR. */
export const eisSigningPrivateKey = (process.env.EIS_SIGNING_PRIVATE_KEY || '').replace(/\\n/g, '\n')
export const eisTimeoutMs = Number(process.env.EIS_TIMEOUT_MS || 30000)

/** Shared secret for the scheduled transmission job (Authorization: Bearer <secret>). */
export const cronSecret = process.env.CRON_SECRET || ''

/** Days before a password must be changed (CAS security standard, RMC 5-2021 Annex B: 30). */
export const passwordMaxAgeDays = Number(process.env.PASSWORD_MAX_AGE_DAYS || 30)
