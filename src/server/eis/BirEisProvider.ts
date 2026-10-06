import 'server-only'

import { createSign } from 'node:crypto'
import {
    eisApplicationId,
    eisApplicationSecret,
    eisBaseUrl,
    eisSigningPrivateKey,
    eisTimeoutMs,
} from '@/server/env'
import type { EisInvoicePayload, EisProvider, EisTransmitResult } from './types'

const base64url = (value: Buffer | string) => Buffer.from(value).toString('base64url')

/** Compact JWS (RS256) over the JSON payload, signed with the taxpayer's registered key pair. */
const signJws = (payload: unknown, privateKey: string) => {
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const body = base64url(JSON.stringify(payload))
    const signer = createSign('RSA-SHA256')
    signer.update(`${header}.${body}`)
    return `${header}.${body}.${signer.sign(privateKey).toString('base64url')}`
}

/**
 * Transmits to the BIR EIS. BIR issues the API specification, endpoints and credentials to the taxpayer
 * during EIS certification (eis-cert.bir.gov.ph); they are not public. Before going live:
 *   1. Set EIS_BASE_URL, EIS_APPLICATION_ID, EIS_APPLICATION_SECRET and
 *      EIS_SIGNING_PRIVATE_KEY from the certification portal.
 *   2. Map `EisInvoicePayload` to the exact property names in BIR's JSON schema in `toBirDocument`, and
 *      add payload encryption if your specification version requires it.
 *   3. Pass BIR's mandatory certification tests with these settings.
 * Until then every transmission fails with a clear configuration message and stays queued for retry.
 */
export class BirEisProvider implements EisProvider {
    readonly name = 'BIR EIS'

    async transmit(payload: EisInvoicePayload): Promise<EisTransmitResult> {
        if (!eisBaseUrl || !eisApplicationId || !eisApplicationSecret || !eisSigningPrivateKey) {
            return {
                status: 'failed',
                birReference: null,
                responseCode: 'NOT_CONFIGURED',
                responseMessage:
                    'BIR EIS credentials are not configured. Add the values from your EIS certification and try again.',
            }
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), eisTimeoutMs)
        try {
            const response = await fetch(`${eisBaseUrl.replace(/\/$/, '')}/invoices`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/jose',
                    'X-Application-Id': eisApplicationId,
                    Authorization: `Bearer ${eisApplicationSecret}`,
                },
                body: signJws(this.toBirDocument(payload), eisSigningPrivateKey),
            })
            const text = await response.text()
            let body: { reference?: string; code?: string; message?: string } = {}
            try {
                body = JSON.parse(text)
            } catch {
                body = { message: text.slice(0, 500) }
            }
            if (response.ok) {
                return {
                    status: 'accepted',
                    birReference: body.reference ?? null,
                    responseCode: body.code ?? String(response.status),
                    responseMessage: body.message ?? 'Accepted.',
                }
            }
            // 4xx: BIR rejected the document (needs correction); 5xx: temporary, retry later
            return {
                status: response.status >= 400 && response.status < 500 ? 'rejected' : 'failed',
                birReference: null,
                responseCode: body.code ?? String(response.status),
                responseMessage: body.message ?? `BIR EIS responded with HTTP ${response.status}.`,
            }
        } catch (error) {
            return {
                status: 'failed',
                birReference: null,
                responseCode: 'NETWORK',
                responseMessage: error instanceof Error ? error.message : 'Could not reach the BIR EIS.',
            }
        } finally {
            clearTimeout(timeout)
        }
    }

    /** Maps the canonical payload to BIR's schema. Align property names with your EIS specification version. */
    private toBirDocument(payload: EisInvoicePayload) {
        return payload
    }
}
