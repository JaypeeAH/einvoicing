import { isAxiosError } from 'axios'

/** Best-effort, user-readable message from any thrown value (Axios errors use the API's `message`). */
export const tryGetErrorMessage = (error: unknown): string => {
    if (!error) return 'Something went wrong.'
    if (typeof error === 'string') return error
    if (isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined
        if (data?.message) return data.message
        if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
        if (error.response?.status === 403) return 'You do not have permission to do this.'
        if (!error.response) return 'Cannot reach the server. Check your connection and try again.'
        return error.message
    }
    if (error instanceof Error) return error.message
    return 'Something went wrong.'
}

/** Field-level problems returned by the API (400 responses), keyed by form field path. */
export const tryGetFieldErrors = (error: unknown): { field: string; message: string }[] => {
    if (isAxiosError(error)) {
        const details = (error.response?.data as { details?: unknown } | undefined)?.details
        if (Array.isArray(details)) {
            return details.filter(
                (item): item is { field: string; message: string } =>
                    typeof item?.field === 'string' && typeof item?.message === 'string',
            )
        }
    }
    return []
}
