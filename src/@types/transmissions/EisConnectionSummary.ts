import type { EisEnvironment } from '@/constants/bir.constant'

/** The organization's EIS connection without its secrets (passwords and keys never leave the server). */
export interface EisConnectionSummary {
    /** `mock` simulates the EIS on this deployment; `bir` sends to the BIR EIS. */
    provider: 'mock' | 'bir'
    /** False when EIS_CREDENTIALS_KEY is missing, so credentials cannot be stored. */
    canStoreCredentials: boolean
    configured: boolean
    environment: EisEnvironment | null
    apiBaseUrl: string | null
    accreditationId: string | null
    applicationId: string | null
    userId: string | null
    jwsKeyId: string | null
    tokenExpiresAt: string | null
    lastTestedAt: string | null
    lastTestOk: boolean | null
    lastTestMessage: string | null
    updatedAt: string | null
}
