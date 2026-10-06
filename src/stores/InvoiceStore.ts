'use client'

import { createResourceStore } from '@/stores/createResourceStore'
import type { InvoiceDetails } from '@/@types/invoices/InvoiceDetails'

/** The invoice open on the details page. */
export const useInvoiceStore = createResourceStore<InvoiceDetails>()
