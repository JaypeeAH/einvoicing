import 'server-only'

import { apiAuthHandler, getPaging, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { listInvoices, saveInvoiceDraft } from '@/server/data/invoices'
import { InvoiceFormSchema } from '@/@types/invoices/forms/InvoiceFormData'
import { ACTION_INVOICE_ISSUE, ACTION_INVOICE_VIEW } from '@/constants/actions.constant'
import { DOCUMENT_TYPES, INVOICE_STATUSES, type DocumentType, type InvoiceStatus } from '@/constants/bir.constant'

const pick = <T extends string>(value: string | null, allowed: readonly T[]) =>
    value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined

export const GET = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const { searchParams } = new URL(req.url)
        const result = await listInvoices(supabase, organizationId, {
            ...getPaging(searchParams),
            query: searchParams.get('query') || undefined,
            status: pick<InvoiceStatus>(searchParams.get('status'), INVOICE_STATUSES),
            documentType: pick<DocumentType>(searchParams.get('documentType'), DOCUMENT_TYPES),
            branchId: searchParams.get('branchId') || undefined,
            customerId: searchParams.get('customerId') || undefined,
            dateFrom: searchParams.get('dateFrom') || undefined,
            dateTo: searchParams.get('dateTo') || undefined,
        })
        return getJsonResponse(result)
    },
    { action: ACTION_INVOICE_VIEW },
)

/** Creates a draft. Serial numbers are assigned only when the draft is issued. */
export const POST = apiAuthHandler(
    async (req, _ctx, session) => {
        const payload = await parseJsonBody(req, InvoiceFormSchema)
        return getJsonResponse(await saveInvoiceDraft(session, payload), { status: 201 })
    },
    { action: ACTION_INVOICE_ISSUE },
)
