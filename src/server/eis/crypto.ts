import 'server-only'

import {
    constants,
    createCipheriv,
    createDecipheriv,
    createHmac,
    createPrivateKey,
    createPublicKey,
    createSign,
    publicEncrypt,
    randomBytes,
    randomInt,
} from 'node:crypto'
import dayjs from 'dayjs'
import { BUSINESS_TIME_ZONE } from '@/utils/date'

// Cryptography prescribed by the EIS e-invoice API development guide (chapter 6) and BIR's sample code
// (docs/bir-eis/source/sample-code). Keys exchanged with the EIS are 32-character strings used
// as raw UTF-8 bytes; the AES IV is the first 16 characters of the key.

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const UPPER_ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

const randomString = (length: number, alphabet: string) =>
    Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('')

/** Temporary secret key sent with the Authentication API (`authKey`, 32 characters). */
export const generateAuthKey = () => randomString(32, ALPHANUMERIC)

/** EIS date-time header value: Philippine time, `yyyyMMddHHmmss` (must be within 10 minutes of the EIS clock). */
export const eisDatetime = (date: Date = new Date()) => dayjs(date).tz(BUSINESS_TIME_ZONE).format('YYYYMMDDHHmmss')

/** `{EIS Cert Number}-{yyyyMMdd}-{12 hex}` — unique per Invoice Issuance call (API guide 7.2.2.2). */
export const generateSubmitId = (accreditationId: string, date: Date = new Date()) =>
    `${accreditationId}-${dayjs(date).tz(BUSINESS_TIME_ZONE).format('YYYYMMDD')}-${randomBytes(6).toString('hex')}`

/**
 * e-Invoice unique ID (`EisUniqueId`, JSON format field 3): issue date `YYYYMMDD` + EIS Cert Number (8 digits)
 * + 8 random uppercase alphanumeric control characters = 24 characters.
 */
export const generateEisUniqueId = (issueDate: string, accreditationId: string) =>
    `${issueDate.replace(/-/g, '')}${accreditationId}${randomString(8, UPPER_ALPHANUMERIC)}`

const toAesKey = (key: string) => {
    const bytes = Buffer.from(key, 'utf8')
    if (bytes.length !== 32) throw new Error('EIS AES keys must be 32 bytes.')
    return { key: bytes, iv: bytes.subarray(0, 16) }
}

/** AES-256-CBC / PKCS#7 with the key's first 16 bytes as IV, base64 output (API guide 6.5.5). */
export const aesEncrypt = (plainText: string, key: string) => {
    const { key: keyBytes, iv } = toAesKey(key)
    const cipher = createCipheriv('aes-256-cbc', keyBytes, iv)
    return Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]).toString('base64')
}

export const aesDecrypt = (cipherText: string, key: string) => {
    const { key: keyBytes, iv } = toAesKey(key)
    const decipher = createDecipheriv('aes-256-cbc', keyBytes, iv)
    return Buffer.concat([decipher.update(Buffer.from(cipherText, 'base64')), decipher.final()]).toString('utf8')
}

/** Reads a public key given as PEM or as the bare base64 SPKI string BIR publishes. */
const toPublicKey = (value: string) =>
    value.includes('BEGIN')
        ? createPublicKey(value)
        : createPublicKey({ key: Buffer.from(value.replace(/\s+/g, ''), 'base64'), format: 'der', type: 'spki' })

/** RSA PKCS#1 v1.5 encryption with the EIS public key, base64 output (Authentication API `data`). */
export const rsaEncrypt = (plainText: string, publicKey: string) =>
    publicEncrypt(
        { key: toPublicKey(publicKey), padding: constants.RSA_PKCS1_PADDING },
        Buffer.from(plainText, 'utf8'),
    ).toString('base64')

/**
 * `Authorization` header: `Bearer ` + base64(HMAC-SHA256(secret, datetime + METHOD + path)). The secret is
 * the Application Key for the Authentication API and the session key for every other call (API guide 6.6).
 */
export const hmacSignature = (secret: string, datetime: string, method: string, path: string) =>
    `Bearer ${createHmac('sha256', Buffer.from(secret, 'utf8'))
        .update(`${datetime}${method.toUpperCase()}${path}`, 'utf8')
        .digest('base64')}`

/** Accepts the private key as PEM or as the bare base64 PKCS#8 body from the EIS credential file. */
export const normalizePrivateKey = (value: string) => {
    const trimmed = value.trim().replace(/\\n/g, '\n')
    if (trimmed.includes('BEGIN')) return trimmed
    const body = trimmed.replace(/\s+/g, '')
    return `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g)?.join('\n') ?? body}\n-----END PRIVATE KEY-----\n`
}

/** Throws when the key cannot be parsed, so a bad paste is caught when it is saved. */
export const assertValidPrivateKey = (value: string) => {
    createPrivateKey(normalizePrivateKey(value))
}

/**
 * Compact JWS, RS256, with the digital signing key pair generated on the EIS Certification portal; `kid` is
 * the key ID shown with it (API guide 6.4, sample code `jws.sign(..., headers={"kid": JWS_KEY_ID})`).
 */
export const signJws = (json: string, privateKey: string, keyId: string) => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: keyId })).toString('base64url')
    const payload = Buffer.from(json, 'utf8').toString('base64url')
    const signer = createSign('RSA-SHA256')
    signer.update(`${header}.${payload}`)
    return `${header}.${payload}.${signer.sign(normalizePrivateKey(privateKey)).toString('base64url')}`
}

// ---------------------------------------------------------------------------------------------------------
// Secrets at rest: EIS passwords, application keys, private keys and session keys are stored encrypted with
// AES-256-GCM under EIS_CREDENTIALS_KEY (32 random bytes, base64). Format: v1.<iv>.<tag>.<ciphertext>.
// ---------------------------------------------------------------------------------------------------------

const toMasterKey = (masterKey: string) => {
    const bytes = Buffer.from(masterKey, 'base64')
    if (bytes.length !== 32) {
        throw new Error('EIS_CREDENTIALS_KEY must be 32 random bytes encoded in base64 (openssl rand -base64 32).')
    }
    return bytes
}

export const sealSecret = (plainText: string, masterKey: string) => {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', toMasterKey(masterKey), iv)
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
    return ['v1', iv, cipher.getAuthTag(), encrypted]
        .map((part) => (typeof part === 'string' ? part : part.toString('base64')))
        .join('.')
}

export const openSecret = (sealed: string, masterKey: string) => {
    const [version, iv, tag, encrypted] = sealed.split('.')
    if (version !== 'v1' || !iv || !tag || !encrypted) throw new Error('Unreadable stored EIS secret.')
    const decipher = createDecipheriv('aes-256-gcm', toMasterKey(masterKey), Buffer.from(iv, 'base64'))
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8')
}
