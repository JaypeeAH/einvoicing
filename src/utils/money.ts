/** Rounds to centavos using half-up rounding (the convention BIR uses for invoice amounts). */
export const roundMoney = (value: number) => {
    const sign = value < 0 ? -1 : 1
    return (sign * Math.round((Math.abs(value) + Number.EPSILON) * 100)) / 100
}

/** Sums values and rounds the result to centavos. */
export const sumMoney = (values: number[]) => roundMoney(values.reduce((sum, value) => sum + value, 0))

const pesoFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const amountFormatter = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

/** `₱1,234.50` */
export const formatPeso = (value: number | null | undefined) => pesoFormatter.format(value ?? 0)

/** `1,234.50` (for tables and printed invoices where the currency is in the header) */
export const formatAmount = (value: number | null | undefined) => amountFormatter.format(value ?? 0)

/** Formats a quantity without trailing zeroes (`2`, `1.5`, `0.125`). */
export const formatQuantity = (value: number) =>
    new Intl.NumberFormat('en-PH', { maximumFractionDigits: 4 }).format(value)

/** Formats a rate (0.12 → `12%`). */
export const formatRate = (rate: number) => `${roundMoney(rate * 100)}%`
