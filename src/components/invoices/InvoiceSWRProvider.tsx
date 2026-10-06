'use client'

import { useLayoutEffect } from 'react'
import { useSWRInvoice } from '@/services/invoices'
import { useInvoiceStore } from '@/stores/InvoiceStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

interface InvoiceSWRProviderProps extends ProviderProps {
    invoiceId: string
}

/** Loads one invoice (with lines, adjustments and audit names) into InvoiceStore. */
export default function InvoiceSWRProvider({ invoiceId, children }: InvoiceSWRProviderProps) {
    // Never show the previously opened invoice while the next one loads
    useLayoutEffect(() => {
        if (useInvoiceStore.getState().data?.id !== invoiceId) useInvoiceStore.getState().setData(undefined)
    }, [invoiceId])

    useSyncResource(useInvoiceStore, useSWRInvoice(invoiceId))
    return <>{children}</>
}
