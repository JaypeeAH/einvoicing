/** Escapes one CSV cell (RFC 4180). Text starting with =, +, - or @ is prefixed to block formula injection. */
const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) return ''
    let text = typeof value === 'number' ? value.toFixed(2) : String(value)
    if (typeof value !== 'number' && /^[=+\-@]/.test(text)) text = `'${text}`
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Builds CSV text. `preamble` rows (report title, taxpayer details) come first, separated from the table
 * by a blank line, matching the header block BIR expects on system-generated books.
 */
export const toCsv = (header: string[], rows: unknown[][], preamble: unknown[][] = []) => {
    const lines = [...preamble, ...(preamble.length > 0 ? [[]] : []), header, ...rows]
    return lines.map((row) => row.map(escapeCell).join(',')).join('\r\n')
}
