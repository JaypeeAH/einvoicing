import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import type { Collection } from '@/@types/collections'
import type { EisTransmission } from '@/@types/transmissions/EisTransmission'
import type { TransmissionStatus } from '@/constants/bir.constant'
import type { EisConnectionSummary } from '@/@types/transmissions/EisConnectionSummary'
import type { EisConnectionPayload } from '@/@types/transmissions/forms/EisConnectionFormData'

export interface TransmissionsParams {
    page?: number
    size?: number
    status?: TransmissionStatus
}

const transmissionsPath = '/transmissions'

const getTransmissionsUrl = (params: TransmissionsParams) => {
    const search = new URLSearchParams()
    if (params.page) search.set('page', String(params.page))
    if (params.size) search.set('size', String(params.size))
    if (params.status) search.set('status', params.status)
    const value = search.toString()
    return `${transmissionsPath}${value ? `?${value}` : ''}`
}

export interface EisRunSummary {
    sent: number
    accepted: number
    rejected: number
    failed: number
    cancelled: number
    message: string | null
}

/** Sends one transmission now (retry), or every pending one when no id is given, and collects results. */
export const apiSendTransmissions = (transmissionId?: string) =>
    api.fetchJson<EisRunSummary>({ method: 'post', url: `${transmissionsPath}/send`, data: { transmissionId } })

const eisConnectionPath = '/eis/connection'

export const apiSaveEisConnection = (data: EisConnectionPayload) =>
    api.fetchJson<EisConnectionSummary>({ method: 'put', url: eisConnectionPath, data })

export const apiDeleteEisConnection = () =>
    api.fetchJson<EisConnectionSummary>({ method: 'delete', url: eisConnectionPath })

/** Calls the EIS Authentication API with the saved credentials. */
export const apiTestEisConnection = () =>
    api.fetchJson<EisConnectionSummary>({ method: 'post', url: `${eisConnectionPath}/test` })

export const useSWREisConnection = (config?: SWRConfiguration<EisConnectionSummary>) =>
    useSWR(eisConnectionPath, (url: string) => api.fetchJson<EisConnectionSummary>({ method: 'get', url }), config)

export const useSWRTransmissions = (
    params: TransmissionsParams | null,
    config?: SWRConfiguration<Collection<EisTransmission>>,
) =>
    useSWR(
        params ? getTransmissionsUrl(params) : null,
        (url: string) => api.fetchJson<Collection<EisTransmission>>({ method: 'get', url }),
        { keepPreviousData: true, ...config },
    )
