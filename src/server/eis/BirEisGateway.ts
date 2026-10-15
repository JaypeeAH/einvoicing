import 'server-only'

import dayjs from 'dayjs'
import { eisTimeoutMs } from '@/server/env'
import { BUSINESS_TIME_ZONE } from '@/utils/date'
import { EIS_MAX_INVOICES_PER_SUBMISSION } from '@/constants/bir.constant'
import {
    aesDecrypt,
    aesEncrypt,
    eisDatetime,
    generateAuthKey,
    generateSubmitId,
    hmacSignature,
    rsaEncrypt,
    signJws,
} from './crypto'
import type {
    EisConnection,
    EisDocumentResult,
    EisGateway,
    EisInquiryResult,
    EisOutgoingDocument,
    EisSession,
    EisSubmissionAck,
} from './types'

// Client for the BIR EIS e-invoice API (development guide chapter 7; BIR sample code in
// docs/bir-eis/source/sample-code). Every call carries accreditationId, applicationId, datetime
// (Philippine time) and an HMAC `authorization`; payloads are AES-256 encrypted with the session key.

const AUTHENTICATION_PATH = '/api/authentication'
const INVOICES_PATH = '/api/invoices'
const INVOICE_RESULT_PATH = '/api/invoice_result'

/** Renew the token this long before BIR's expiry. */
const TOKEN_MARGIN_MINUTES = 10

/** Error returned by the EIS (`errorDetails.errorCode`, e.g. E03, E23) or a transport problem. */
export class EisApiError extends Error {
    constructor(
        message: string,
        readonly code: string,
        readonly httpStatus: number | null = null,
    ) {
        super(message)
        this.name = 'EisApiError'
    }

    /** Wrong credentials or setup: retrying will not help until someone fixes the EIS connection. */
    get isConfiguration() {
        return ['E01', 'E02', 'E04', 'E06', 'E07', 'E08', 'E12', 'E13', 'E23', 'E24'].includes(this.code)
    }
}

interface EisResponseBody {
    status?: string
    data?: unknown
    errorDetails?: { errorCode?: string; errorMessage?: string }
}

export interface EisSessionStore {
    load(): EisSession | null
    save(session: EisSession): Promise<void>
}

const isUsable = (session: EisSession | null): session is EisSession =>
    !!session && dayjs(session.expiresAt).subtract(TOKEN_MARGIN_MINUTES, 'minute').isAfter(dayjs())

/** `tokenExpiry` is `yyyy-MM-ddThh:mm:ss` in Philippine time. */
const parseExpiry = (value: unknown) => {
    const parsed = typeof value === 'string' ? dayjs.tz(value, BUSINESS_TIME_ZONE) : null
    return parsed?.isValid() ? parsed.toISOString() : dayjs().add(6, 'hour').toISOString()
}

const parseJson = <T>(value: string, what: string): T => {
    try {
        return JSON.parse(value) as T
    } catch {
        throw new EisApiError(`The EIS returned an unreadable ${what}.`, 'INVALID_RESPONSE')
    }
}

export class BirEisGateway implements EisGateway {
    readonly name: string
    readonly simulated = false

    constructor(
        private readonly connection: EisConnection,
        private readonly sessions: EisSessionStore,
    ) {
        this.name = connection.environment === 'production' ? 'BIR EIS' : 'BIR EIS sandbox'
    }

    get environment() {
        return this.connection.environment
    }

    get accreditationId() {
        return this.connection.accreditationId
    }

    private url(path: string) {
        return `${this.connection.apiBaseUrl.replace(/\/+$/, '')}${path}`
    }

    private async call(
        method: 'GET' | 'POST',
        path: string,
        options: { secret: string; authToken?: string; body?: unknown },
    ): Promise<EisResponseBody> {
        const url = this.url(path)
        const datetime = eisDatetime()
        const headers: Record<string, string> = {
            'Content-Type': 'application/json; charset=utf-8',
            accreditationId: this.connection.accreditationId,
            applicationId: this.connection.applicationId,
            datetime,
            // HMAC over the request path without the domain (API guide 6.6.2)
            authorization: hmacSignature(options.secret, datetime, method, new URL(url).pathname),
        }
        if (options.authToken) headers.authToken = options.authToken

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), eisTimeoutMs)
        let response: Response
        try {
            response = await fetch(url, {
                method,
                headers,
                body: options.body === undefined ? undefined : JSON.stringify(options.body),
                signal: controller.signal,
                cache: 'no-store',
            })
        } catch (error) {
            throw new EisApiError(
                error instanceof Error && error.name === 'AbortError'
                    ? 'The BIR EIS did not respond in time.'
                    : 'Could not reach the BIR EIS.',
                'NETWORK',
            )
        } finally {
            clearTimeout(timeout)
        }

        const text = await response.text()
        let body: EisResponseBody = {}
        try {
            body = text ? (JSON.parse(text) as EisResponseBody) : {}
        } catch {
            throw new EisApiError(
                `The BIR EIS responded with HTTP ${response.status}: ${text.slice(0, 200)}`,
                `HTTP${response.status}`,
                response.status,
            )
        }
        if (!response.ok || body.status !== '1') {
            const code = body.errorDetails?.errorCode ?? `HTTP${response.status}`
            const message = body.errorDetails?.errorMessage ?? `The BIR EIS responded with HTTP ${response.status}.`
            throw new EisApiError(`${code}: ${message}`, code, response.status)
        }
        return body
    }

    /** Authentication API (7.1): returns a token and session key, reusing a saved one until it expires. */
    async authenticate(forceRefresh = false): Promise<EisSession> {
        const saved = this.sessions.load()
        if (!forceRefresh && isUsable(saved)) return saved

        const authKey = generateAuthKey()
        const data = rsaEncrypt(
            JSON.stringify({ userId: this.connection.userId, password: this.connection.password, authKey }),
            this.connection.eisPublicKey,
        )
        const body = await this.call('POST', AUTHENTICATION_PATH, {
            secret: this.connection.applicationKey,
            body: { data, forceRefreshToken: forceRefresh },
        })
        if (typeof body.data !== 'string')
            throw new EisApiError('The EIS returned no session data.', 'INVALID_RESPONSE')

        const result = parseJson<{ authToken?: string; sessionKey?: string; tokenExpiry?: string }>(
            aesDecrypt(body.data, authKey),
            'authentication response',
        )
        if (!result.authToken || !result.sessionKey) {
            throw new EisApiError('The EIS returned no authentication token.', 'INVALID_RESPONSE')
        }
        const session = {
            authToken: result.authToken,
            sessionKey: result.sessionKey,
            expiresAt: parseExpiry(result.tokenExpiry),
        }
        await this.sessions.save(session)
        return session
    }

    /** Runs a call with the current session; on E03 (expired/invalid token) re-authenticates once. */
    private async withSession<T>(run: (session: EisSession) => Promise<T>): Promise<T> {
        try {
            return await run(await this.authenticate())
        } catch (error) {
            if (error instanceof EisApiError && error.code === 'E03') {
                return run(await this.authenticate(true))
            }
            throw error
        }
    }

    /** Invoice Issuance API (7.2): 1–100 e-invoices, each a JWS, comma-separated, AES-256 encrypted. */
    async submit(documents: EisOutgoingDocument[]): Promise<EisSubmissionAck> {
        if (documents.length < 1 || documents.length > EIS_MAX_INVOICES_PER_SUBMISSION) {
            throw new Error(`Send 1 to ${EIS_MAX_INVOICES_PER_SUBMISSION} e-invoices per submission.`)
        }
        const tokens = documents
            .map(({ document }) =>
                signJws(JSON.stringify(document), this.connection.jwsPrivateKey, this.connection.jwsKeyId),
            )
            .join(',')

        return this.withSession(async (session) => {
            // A fresh submitId per attempt: E14 rejects a reused one
            const submitId = generateSubmitId(this.connection.accreditationId)
            const body = await this.call('POST', INVOICES_PATH, {
                secret: session.sessionKey,
                authToken: session.authToken,
                body: { submitId, data: aesEncrypt(tokens, session.sessionKey) },
            })
            const ack =
                typeof body.data === 'string'
                    ? parseJson<{ ackId?: string; refSubmitId?: string; description?: string }>(
                          aesDecrypt(body.data, session.sessionKey),
                          'acknowledgment',
                      )
                    : ((body.data ?? {}) as { ackId?: string; refSubmitId?: string; description?: string })
            return {
                submitId: ack.refSubmitId ?? submitId,
                ackId: ack.ackId ?? '',
                description: ack.description ?? 'Received by the EIS.',
            }
        })
    }

    /** Inquiry Result API (7.3): processing (02), completed (01) with per-invoice results, or unavailable (03). */
    async inquire(submitId: string): Promise<EisInquiryResult> {
        return this.withSession(async (session) => {
            const body = await this.call('GET', `${INVOICE_RESULT_PATH}/${encodeURIComponent(submitId)}`, {
                secret: session.sessionKey,
                authToken: session.authToken,
            })
            // The guide shows `data` as plain JSON; accept an encrypted string as other responses use
            const data = (
                typeof body.data === 'string'
                    ? parseJson(aesDecrypt(body.data, session.sessionKey), 'inquiry result')
                    : body.data
            ) as {
                processStatusCode?: string
                failReasonStatusCode?: string
                processedDocuments?: { invoiceUid?: string; resultStatusCode?: string; description?: string }[]
                proccessdDocuments?: { invoiceUid?: string; resultStatusCode?: string; description?: string }[]
            } | null

            switch (data?.processStatusCode) {
                case '01': {
                    const processed = data.processedDocuments ?? data.proccessdDocuments ?? []
                    return {
                        state: 'completed',
                        documents: processed
                            .filter((item) => item.invoiceUid)
                            .map((item): EisDocumentResult => ({
                                uniqueId: item.invoiceUid as string,
                                code: item.resultStatusCode ?? 'ERR999',
                                description: item.description ?? null,
                            })),
                    }
                }
                case '03':
                    return {
                        state: 'unavailable',
                        code: data.failReasonStatusCode ?? '03',
                        message:
                            data.failReasonStatusCode === 'FRS002'
                                ? 'The EIS could not decrypt the submission.'
                                : 'The EIS could not process the submission.',
                    }
                default:
                    return { state: 'processing' }
            }
        })
    }
}
