import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/** All business dates are Philippine time (UTC+8), regardless of the server or browser time zone. */
export const BUSINESS_TIME_ZONE = 'Asia/Manila'

/** Today's date in Manila as `YYYY-MM-DD`. */
export const todayInManila = () => dayjs().tz(BUSINESS_TIME_ZONE).format('YYYY-MM-DD')

/** `Oct 6, 2026` */
export const formatDate = (value: string | Date | null | undefined) =>
    value ? dayjs(value).tz(BUSINESS_TIME_ZONE).format('MMM D, YYYY') : ''

/** `Oct 6, 2026 9:41 AM` */
export const formatDateTime = (value: string | Date | null | undefined) =>
    value ? dayjs(value).tz(BUSINESS_TIME_ZONE).format('MMM D, YYYY h:mm A') : ''

/** Date-only strings (`YYYY-MM-DD`) are formatted without time-zone shifting. */
export const formatDateOnly = (value: string | null | undefined) => (value ? dayjs(value).format('MMM D, YYYY') : '')

/** First and last day of the month containing `date` (`YYYY-MM-DD`). */
export const monthRange = (date = todayInManila()) => ({
    from: dayjs(date).startOf('month').format('YYYY-MM-DD'),
    to: dayjs(date).endOf('month').format('YYYY-MM-DD'),
})

/** First and last day of a calendar quarter. */
export const quarterRange = (year: number, quarter: 1 | 2 | 3 | 4) => {
    const start = dayjs(`${year}-01-01`).add((quarter - 1) * 3, 'month')
    return { from: start.format('YYYY-MM-DD'), to: start.add(2, 'month').endOf('month').format('YYYY-MM-DD') }
}

export const currentQuarter = (date = todayInManila()) => (Math.floor(dayjs(date).month() / 3) + 1) as 1 | 2 | 3 | 4
