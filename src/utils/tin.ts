// Philippine Taxpayer Identification Number helpers. A TIN is 9 digits; the 3- to 5-digit branch code that
// follows identifies the place of business (head office = 00000).

const digitsOnly = (value: string) => value.replace(/\D/g, '')

/** Accepts 9 digits, optionally followed by a 3–5 digit branch code, with or without dashes/spaces. */
export const isValidTin = (value: string | null | undefined) => {
    if (!value) return false
    const digits = digitsOnly(value)
    return digits.length === 9 || (digits.length >= 12 && digits.length <= 14)
}

/** Returns the 9-digit TIN as `123-456-789` (branch code dropped; it is stored separately). */
export const normalizeTin = (value: string) => {
    const digits = digitsOnly(value).slice(0, 9)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`
}

/** Branch code from a full TIN entry (`123-456-789-00001` → `00001`), or null when not given. */
export const extractBranchCode = (value: string) => {
    const digits = digitsOnly(value)
    return digits.length > 9 ? digits.slice(9).padStart(5, '0') : null
}

/** `123-456-789` + `00000` → `123-456-789-00000` */
export const formatTinWithBranch = (tin: string | null | undefined, branchCode: string | null | undefined) => {
    if (!tin) return ''
    return branchCode ? `${normalizeTin(tin)}-${branchCode}` : normalizeTin(tin)
}
