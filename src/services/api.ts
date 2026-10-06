import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import axiosRetry, { isNetworkError } from 'axios-retry'
import { apiPath } from '@/configs/app.config'

export type ApiOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>

const instance = axios.create({
    baseURL: apiPath,
    timeout: 60_000,
    withCredentials: true,
    headers: { Accept: 'application/json' },
})

// Retry idempotent reads on network errors and gateway failures. Writes are never retried automatically:
// issuing an invoice twice must be impossible.
axiosRetry(instance, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) =>
        (error.config?.method ?? 'get').toLowerCase() === 'get' &&
        (isNetworkError(error) || [502, 503, 504].includes(error.response?.status ?? 0)),
})

/** Centralized HTTP client for the app's own /api routes. */
const api = {
    /** Returns the response body. */
    fetchJson: async <T>(config: AxiosRequestConfig): Promise<T> => (await instance.request<T>(config)).data,
    /** Returns the full Axios response. */
    fetch: <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => instance.request<T>(config),
    /** Downloads a file (e.g. a CSV export) and returns it with the server's file name. */
    fetchBlob: async (config: AxiosRequestConfig): Promise<{ data: Blob; name: string }> => {
        const response = await instance.request<Blob>({ ...config, responseType: 'blob' })
        const disposition = String(response.headers['content-disposition'] ?? '')
        const name = /filename="?([^"]+)"?/.exec(disposition)?.[1] ?? 'download'
        return { data: response.data, name }
    },
}

/** Saves a downloaded blob through the browser. */
export const saveBlob = ({ data, name }: { data: Blob; name: string }) => {
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

export default api
