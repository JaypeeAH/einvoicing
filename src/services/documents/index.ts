import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import type { ComplianceDocument } from '@/@types/documents/ComplianceDocument'
import type { DocumentCategory } from '@/constants/bir.constant'

const documentsPath = '/documents'

export const apiUploadDocument = (input: { file: File; category: DocumentCategory; title: string }) => {
    const data = new FormData()
    data.append('file', input.file)
    data.append('category', input.category)
    data.append('title', input.title)
    return api.fetchJson<ComplianceDocument[]>({ method: 'post', url: documentsPath, data })
}

/** Short-lived signed URL for downloading a private document. */
export const apiGetDocumentDownloadUrl = (documentId: string) =>
    api.fetchJson<{ url: string }>({ method: 'get', url: `${documentsPath}/${documentId}` })

export const apiDeleteDocument = (documentId: string) =>
    api.fetchJson<void>({ method: 'delete', url: `${documentsPath}/${documentId}` })

export const useSWRDocuments = (config?: SWRConfiguration<ComplianceDocument[]>) =>
    useSWR(documentsPath, (url: string) => api.fetchJson<ComplianceDocument[]>({ method: 'get', url }), config)
