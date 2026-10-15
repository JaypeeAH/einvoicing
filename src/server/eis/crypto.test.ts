import { createVerify, generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
    aesDecrypt,
    aesEncrypt,
    eisDatetime,
    generateAuthKey,
    generateEisUniqueId,
    generateSubmitId,
    hmacSignature,
    openSecret,
    rsaEncrypt,
    sealSecret,
    signJws,
} from './crypto'
import { EIS_CERTIFICATION_PUBLIC_KEY } from './publicKey'

// Reference values computed independently (openssl enc -aes-256-cbc; Python hmac) the way BIR's sample
// code does it: the 32-character key as raw bytes, IV = its first 16 characters, base64 output.
const KEY = 'abcdefghijklmnopqrstuvwxyz012345'

describe('EIS cryptography', () => {
    it('encrypts like the BIR sample code (AES-256-CBC, IV = first 16 key characters)', () => {
        const plain = '{"ackId":"BIR-20210325154527-E8QN3"}'
        const encrypted = aesEncrypt(plain, KEY)
        expect(encrypted).toBe('/wYNqFrFgUx8oc2oZtwmA5FeUcUcfbtnlWFj1qLRJkYpvOQhWE6/yjjr+sMFDvst')
        expect(aesDecrypt(encrypted, KEY)).toBe(plain)
    })

    it('rejects keys that are not 32 bytes', () => {
        expect(() => aesEncrypt('x', 'short')).toThrow()
    })

    it('signs requests with base64 HMAC-SHA256 over datetime + method + path', () => {
        expect(hmacSignature('X8TD8UUEDTK7', '20220217093015', 'post', '/api/authentication')).toBe(
            'Bearer xRp3k5Bg94iRomz+bvE3+HpMl+sEIi9rq8crJK3MZJg=',
        )
    })

    it('RSA-encrypts the authentication data with the published EIS key (PKCS#1 v1.5 is randomized)', () => {
        // Node no longer allows PKCS#1 v1.5 private decryption, so check the ciphertext shape instead
        const data = JSON.stringify({ userId: 'u', password: 'p', authKey: generateAuthKey() })
        const first = rsaEncrypt(data, EIS_CERTIFICATION_PUBLIC_KEY)
        expect(Buffer.from(first, 'base64')).toHaveLength(256)
        expect(rsaEncrypt(data, EIS_CERTIFICATION_PUBLIC_KEY)).not.toBe(first)
    })

    it('creates a compact RS256 JWS with the key ID in the header', () => {
        const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
        const pem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()
        const bareBody = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
        const token = signJws('{"CompInvoiceId":"1"}', bareBody, 'KEY-1')
        const [header, payload, signature] = token.split('.')
        expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({ alg: 'RS256', kid: 'KEY-1' })
        expect(Buffer.from(payload, 'base64url').toString()).toBe('{"CompInvoiceId":"1"}')
        const verifier = createVerify('RSA-SHA256')
        verifier.update(`${header}.${payload}`)
        expect(verifier.verify(publicKey, Buffer.from(signature, 'base64url'))).toBe(true)
    })

    it('generates IDs in the formats BIR prescribes', () => {
        const date = new Date('2026-07-30T01:00:00Z')
        expect(generateSubmitId('20146141', date)).toMatch(/^20146141-20260730-[0-9a-f]{12}$/)
        expect(generateEisUniqueId('2026-07-30', '20146141')).toMatch(/^2026073020146141[0-9A-Z]{8}$/)
        expect(generateAuthKey()).toHaveLength(32)
        // Philippine time (UTC+8)
        expect(eisDatetime(new Date('2026-07-30T16:30:15Z'))).toBe('20260731003015')
    })

    it('seals secrets at rest with AES-256-GCM', () => {
        const master = Buffer.alloc(32, 7).toString('base64')
        const sealed = sealSecret('portal-password', master)
        expect(sealed.startsWith('v1.')).toBe(true)
        expect(sealed).not.toContain('portal-password')
        expect(openSecret(sealed, master)).toBe('portal-password')
        expect(() => openSecret(sealed, Buffer.alloc(32, 8).toString('base64'))).toThrow()
    })
})
