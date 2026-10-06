import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import type { DocumentSeries } from '@/@types/series/DocumentSeries'
import type { DocumentSeriesFormData } from '@/@types/series/forms/DocumentSeriesFormData'

const seriesPath = '/series'

export const apiCreateSeries = (data: DocumentSeriesFormData) =>
    api.fetchJson<DocumentSeries>({ method: 'post', url: seriesPath, data })

export const apiUpdateSeries = (seriesId: string, data: DocumentSeriesFormData) =>
    api.fetchJson<DocumentSeries>({ method: 'put', url: `${seriesPath}/${seriesId}`, data })

export const useSWRSeries = (config?: SWRConfiguration<DocumentSeries[]>) =>
    useSWR(seriesPath, (url: string) => api.fetchJson<DocumentSeries[]>({ method: 'get', url }), config)
