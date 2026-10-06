import type { PageParams } from '@/@types/collections'
import type { DocumentType, InvoiceStatus } from '@/constants/bir.constant'

export interface InvoicesParams extends PageParams {
    status?: InvoiceStatus
    documentType?: DocumentType
    branchId?: string
    customerId?: string
    dateFrom?: string
    dateTo?: string
}

export const getInvoicesSearchParams = (params: InvoicesParams) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
    })
    const value = search.toString()
    return value ? `?${value}` : ''
}
