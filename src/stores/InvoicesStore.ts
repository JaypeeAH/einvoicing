'use client'

import { createCollectionStore } from '@/stores/createCollectionStore'
import type { Invoice } from '@/@types/invoices/Invoice'
import type { DocumentType, InvoiceStatus } from '@/constants/bir.constant'

export interface InvoicesFilter {
    status?: InvoiceStatus
    documentType?: DocumentType
    branchId?: string
    dateFrom?: string
    dateTo?: string
}

/** Invoices & memos list (paged, searchable, filterable). */
export const useInvoicesStore = createCollectionStore<Invoice, InvoicesFilter>({})
