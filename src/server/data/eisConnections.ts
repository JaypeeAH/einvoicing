import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { eisCredentialsKey, eisProvider } from '@/server/env'
import { assertValidPrivateKey, openSecret, sealSecret } from '@/server/eis/crypto'
import { BirEisGateway, EisApiError, type EisSessionStore } from '@/server/eis/BirEisGateway'
import { getEisPublicKey } from '@/server/eis/publicKey'
import { DataError } from '@/@types/errors'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { EisEnvironment } from '@/constants/bir.constant'
import type { EisConnection, EisSession } from '@/server/eis/types'
import type { EisConnectionSummary } from '@/@types/transmissions/EisConnectionSummary'
import type { EisConnectionPayload } from '@/@types/transmissions/forms/EisConnectionFormData'

// EIS credentials live in `eis_connections`, which only the service role can read. Callers must check the
// user's permission before calling these functions with the admin client.

interface EisConnectionRow {
    organization_id: string
    environment: EisEnvironment
    api_base_url: string
    accreditation_id: string
    application_id: string
    user_id: string
    jws_key_id: string
    application_key_sealed: string
    password_sealed: string
    jws_private_key_sealed: string
    auth_token_sealed: string | null
    session_key_sealed: string | null
    token_expires_at: string | null
    last_tested_at: string | null
    last_test_ok: boolean | null
    last_test_message: string | null
    updated_at: string
}

const requireCredentialsKey = () => {
    if (!eisCredentialsKey) {
        throw new DataError('EIS_CREDENTIALS_KEY is not configured on the server, so EIS credentials cannot be stored.')
    }
    return eisCredentialsKey
}

const fetchRow = async (admin: SupabaseClient, organizationId: string) => {
    const { data, error } = await admin
        .from('eis_connections')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle<EisConnectionRow>()
    if (error) throw error
    return data
}

export const getEisConnectionSummary = async (
    admin: SupabaseClient,
    organizationId: string,
): Promise<EisConnectionSummary> => {
    const row = await fetchRow(admin, organizationId)
    return {
        provider: eisProvider,
        canStoreCredentials: !!eisCredentialsKey,
        configured: !!row,
        environment: row?.environment ?? null,
        apiBaseUrl: row?.api_base_url ?? null,
        accreditationId: row?.accreditation_id ?? null,
        applicationId: row?.application_id ?? null,
        userId: row?.user_id ?? null,
        jwsKeyId: row?.jws_key_id ?? null,
        tokenExpiresAt: row?.token_expires_at ?? null,
        lastTestedAt: row?.last_tested_at ?? null,
        lastTestOk: row?.last_test_ok ?? null,
        lastTestMessage: row?.last_test_message ?? null,
        updatedAt: row?.updated_at ?? null,
    }
}

const writeAudit = async (
    admin: SupabaseClient,
    organizationId: string,
    user: SessionUser,
    action: string,
    summary: string,
    changes: Record<string, unknown> | null = null,
) => {
    const { error } = await admin.from('audit_logs').insert({
        organization_id: organizationId,
        user_id: user.id,
        user_email: user.email,
        action,
        entity_type: 'eis_connections',
        entity_id: organizationId,
        summary,
        changes,
    })
    if (error) throw error
}

/** Saves the EIS connection. Blank secrets keep the saved ones; changed credentials drop the cached session. */
export const saveEisConnection = async (
    admin: SupabaseClient,
    organizationId: string,
    user: SessionUser,
    payload: EisConnectionPayload,
) => {
    const key = requireCredentialsKey()
    const existing = await fetchRow(admin, organizationId)

    const missing = [
        !existing && !payload.password && 'password',
        !existing && !payload.applicationKey && 'applicationKey',
        !existing && !payload.jwsPrivateKey && 'jwsPrivateKey',
    ].filter((field): field is string => !!field)
    if (missing.length) {
        throw new DataError(
            'Enter the password, application key and signing private key.',
            missing.map((field) => ({ field, message: 'Required' })),
        )
    }
    if (payload.jwsPrivateKey) {
        try {
            assertValidPrivateKey(payload.jwsPrivateKey)
        } catch {
            throw new DataError('The signing private key could not be read.', [
                { field: 'jwsPrivateKey', message: 'Paste the private key from the downloaded credential file' },
            ])
        }
    }

    const credentialsChanged =
        !existing ||
        existing.environment !== payload.environment ||
        existing.api_base_url !== payload.apiBaseUrl ||
        existing.accreditation_id !== payload.accreditationId ||
        existing.application_id !== payload.applicationId ||
        existing.user_id !== payload.userId ||
        !!payload.password ||
        !!payload.applicationKey

    const row = {
        organization_id: organizationId,
        environment: payload.environment,
        api_base_url: payload.apiBaseUrl.replace(/\/+$/, ''),
        accreditation_id: payload.accreditationId,
        application_id: payload.applicationId,
        user_id: payload.userId,
        jws_key_id: payload.jwsKeyId,
        application_key_sealed: payload.applicationKey
            ? sealSecret(payload.applicationKey, key)
            : existing!.application_key_sealed,
        password_sealed: payload.password ? sealSecret(payload.password, key) : existing!.password_sealed,
        jws_private_key_sealed: payload.jwsPrivateKey
            ? sealSecret(payload.jwsPrivateKey, key)
            : existing!.jws_private_key_sealed,
        updated_by: user.id,
        ...(credentialsChanged
            ? {
                  auth_token_sealed: null,
                  session_key_sealed: null,
                  token_expires_at: null,
                  last_tested_at: null,
                  last_test_ok: null,
                  last_test_message: null,
              }
            : {}),
    }
    const { error } = await admin.from('eis_connections').upsert(row, { onConflict: 'organization_id' })
    if (error) throw error

    // Never log the secrets, only which ones changed
    await writeAudit(admin, organizationId, user, existing ? 'update' : 'insert', 'EIS connection saved', {
        environment: payload.environment,
        api_base_url: row.api_base_url,
        accreditation_id: payload.accreditationId,
        application_id: payload.applicationId,
        user_id: payload.userId,
        jws_key_id: payload.jwsKeyId,
        password_changed: !!payload.password,
        application_key_changed: !!payload.applicationKey,
        signing_key_changed: !!payload.jwsPrivateKey,
    })
    return getEisConnectionSummary(admin, organizationId)
}

export const deleteEisConnection = async (admin: SupabaseClient, organizationId: string, user: SessionUser) => {
    const { error } = await admin.from('eis_connections').delete().eq('organization_id', organizationId)
    if (error) throw error
    await writeAudit(admin, organizationId, user, 'delete', 'EIS connection removed')
}

/** Decrypted credentials and a session store backed by the table, or null when not set up. */
export const loadEisConnection = async (
    admin: SupabaseClient,
    organizationId: string,
): Promise<{ connection: EisConnection; sessions: EisSessionStore } | null> => {
    const row = await fetchRow(admin, organizationId)
    if (!row) return null
    const key = requireCredentialsKey()

    let cached: EisSession | null =
        row.auth_token_sealed && row.session_key_sealed && row.token_expires_at
            ? {
                  authToken: openSecret(row.auth_token_sealed, key),
                  sessionKey: openSecret(row.session_key_sealed, key),
                  expiresAt: row.token_expires_at,
              }
            : null

    return {
        connection: {
            environment: row.environment,
            apiBaseUrl: row.api_base_url,
            accreditationId: row.accreditation_id,
            applicationId: row.application_id,
            applicationKey: openSecret(row.application_key_sealed, key),
            userId: row.user_id,
            password: openSecret(row.password_sealed, key),
            jwsKeyId: row.jws_key_id,
            jwsPrivateKey: openSecret(row.jws_private_key_sealed, key),
            eisPublicKey: getEisPublicKey(),
        },
        sessions: {
            load: () => cached,
            save: async (session) => {
                cached = session
                const { error } = await admin
                    .from('eis_connections')
                    .update({
                        auth_token_sealed: sealSecret(session.authToken, key),
                        session_key_sealed: sealSecret(session.sessionKey, key),
                        token_expires_at: session.expiresAt,
                    })
                    .eq('organization_id', organizationId)
                if (error) throw error
            },
        },
    }
}

/** Calls the Authentication API with the saved credentials and records the outcome. */
export const testEisConnection = async (admin: SupabaseClient, organizationId: string, user: SessionUser) => {
    const loaded = await loadEisConnection(admin, organizationId)
    if (!loaded) throw new DataError('Save the EIS connection first.')

    let ok = false
    let message: string
    try {
        const session = await new BirEisGateway(loaded.connection, loaded.sessions).authenticate(true)
        ok = true
        message = `Connected to the ${loaded.connection.environment === 'production' ? 'BIR EIS' : 'EIS sandbox'}. Token valid until ${session.expiresAt}.`
    } catch (error) {
        message =
            error instanceof EisApiError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : 'The connection test failed.'
    }

    const { error } = await admin
        .from('eis_connections')
        .update({ last_tested_at: new Date().toISOString(), last_test_ok: ok, last_test_message: message })
        .eq('organization_id', organizationId)
    if (error) throw error
    await writeAudit(admin, organizationId, user, 'test', `EIS connection test ${ok ? 'succeeded' : 'failed'}`, {
        message,
    })
    return getEisConnectionSummary(admin, organizationId)
}
