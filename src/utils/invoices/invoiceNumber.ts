import { MIN_SERIAL_DIGITS } from '@/constants/bir.constant'

/** `SI` + 42 (padding 8) → `SI-00000042`. Mirrors `format_serial()` in the database. */
export const formatSerialNumber = (prefix: string | null | undefined, serial: number, padding = MIN_SERIAL_DIGITS) => {
    const digits = String(serial).padStart(Math.max(padding, MIN_SERIAL_DIGITS), '0')
    return prefix ? `${prefix}-${digits}` : digits
}

/** `SI-000001 to SI-500000` — the approved series printed on the invoice footer. */
export const formatSeriesRange = (prefix: string | null | undefined, start: number, end: number, padding: number) =>
    `${formatSerialNumber(prefix, start, padding)} to ${formatSerialNumber(prefix, end, padding)}`

/** Numbers left in a series, including the next one. */
export const getRemainingSerials = (series: { nextNumber: number; endNumber: number }) =>
    Math.max(series.endNumber - series.nextNumber + 1, 0)

/** Warn when fewer than 10% (or 50 numbers) remain so a new series can be registered in time. */
export const isSeriesRunningLow = (series: { startNumber: number; nextNumber: number; endNumber: number }) => {
    const remaining = getRemainingSerials(series)
    const size = series.endNumber - series.startNumber + 1
    return remaining <= Math.max(50, Math.ceil(size * 0.1))
}
