import { type SWRConfiguration } from 'swr'

/** App-wide SWR defaults (see components/swr/SWRAppConfig). */
export const SWR_DEFAULTS: SWRConfiguration = {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    dedupingInterval: 5000,
}

/** For data that doesn't change while the page is open (e.g. the building list). */
export const SWR_ONCE_ONLY: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
}
