import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import type { Collection } from '@/@types/collections'
import type { EisTransmission } from '@/@types/transmissions/EisTransmission'
import type { TransmissionStatus } from '@/constants/bir.constant'

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

/** Sends one transmission now (retry), or every pending one when no id is given. */
export const apiSendTransmissions = (transmissionId?: string) =>
    api.fetchJson<unknown>({ method: 'post', url: `${transmissionsPath}/send`, data: { transmissionId } })

export const useSWRTransmissions = (
    params: TransmissionsParams | null,
    config?: SWRConfiguration<Collection<EisTransmission>>,
) =>
    useSWR(
        params ? getTransmissionsUrl(params) : null,
        (url: string) => api.fetchJson<Collection<EisTransmission>>({ method: 'get', url }),
        { keepPreviousData: true, ...config },
    )
