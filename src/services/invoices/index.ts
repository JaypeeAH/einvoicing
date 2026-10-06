import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { getInvoicesSearchParams, type InvoicesParams } from '@/@types/invoices'
import type { Collection } from '@/@types/collections'
import type { Invoice } from '@/@types/invoices/Invoice'
import type { InvoiceDetails } from '@/@types/invoices/InvoiceDetails'
import type { InvoiceFormData } from '@/@types/invoices/forms/InvoiceFormData'

const invoicesPath = '/invoices'

const getInvoicesUrl = (params?: InvoicesParams) => `${invoicesPath}${params ? getInvoicesSearchParams(params) : ''}`
const getInvoiceUrl = (invoiceId: string) => `${invoicesPath}/${invoiceId}`

export const apiGetInvoices = (params?: InvoicesParams) =>
    api.fetchJson<Collection<Invoice>>({ method: 'get', url: getInvoicesUrl(params) })

export const apiGetInvoice = (invoiceId: string) =>
    api.fetchJson<InvoiceDetails>({ method: 'get', url: getInvoiceUrl(invoiceId) })

/** Saves a draft (create when `invoiceId` is empty). */
export const apiSaveInvoiceDraft = (data: InvoiceFormData, invoiceId?: string) =>
    api.fetchJson<InvoiceDetails>({
        method: invoiceId ? 'put' : 'post',
        url: invoiceId ? getInvoiceUrl(invoiceId) : invoicesPath,
        data,
    })

export const apiDeleteInvoiceDraft = (invoiceId: string) =>
    api.fetchJson<void>({ method: 'delete', url: getInvoiceUrl(invoiceId) })

/** Issues a draft: assigns its serial number. Never retried automatically. */
export const apiIssueInvoice = (invoiceId: string) =>
    api.fetchJson<InvoiceDetails>({ method: 'post', url: `${getInvoiceUrl(invoiceId)}/issue` })

export const apiVoidInvoice = (invoiceId: string, reason: string) =>
    api.fetchJson<InvoiceDetails>({ method: 'post', url: `${getInvoiceUrl(invoiceId)}/void`, data: { reason } })

/** Records a print and returns the copy number (1 = original, 2+ = reprint). */
export const apiRecordInvoicePrint = (invoiceId: string) =>
    api.fetchJson<{ copy: number }>({ method: 'post', url: `${getInvoiceUrl(invoiceId)}/print` })

export const useSWRInvoices = (params: InvoicesParams | null, config?: SWRConfiguration<Collection<Invoice>>) =>
    useSWR(
        params ? getInvoicesUrl(params) : null,
        (url: string) => api.fetchJson<Collection<Invoice>>({ method: 'get', url }),
        {
            keepPreviousData: true,
            ...config,
        },
    )

export const useSWRInvoice = (invoiceId: string | null, config?: SWRConfiguration<InvoiceDetails>) =>
    useSWR(
        invoiceId ? getInvoiceUrl(invoiceId) : null,
        (url: string) => api.fetchJson<InvoiceDetails>({ method: 'get', url }),
        config,
    )
