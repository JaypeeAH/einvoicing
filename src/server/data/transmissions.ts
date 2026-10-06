import 'server-only'

import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getInvoiceDetails } from '@/server/data/invoices'
import { buildEisPayload } from '@/server/eis/buildPayload'
import { getEisProvider } from '@/server/eis'
import type { Collection } from '@/@types/collections'
import type { EisTransmission } from '@/@types/transmissions/EisTransmission'
import type { TransmissionStatus } from '@/constants/bir.constant'

interface TransmissionRow {
    id: string
    organization_id: string
    invoice_id: string
    status: TransmissionStatus
    attempts: number
    last_attempt_at: string | null
    due_at: string
    bir_reference: string | null
    response_message: string | null
    created_at: string
    invoices: { invoice_number: string | null; document_type: EisTransmission['documentType'] } | null
}

const toTransmission = (row: TransmissionRow): EisTransmission => ({
    id: row.id,
    organizationId: row.organization_id,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoices?.invoice_number ?? null,
    documentType: row.invoices?.document_type ?? 'sales_invoice',
    status: row.status,
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at,
    dueAt: row.due_at,
    birReference: row.bir_reference,
    responseMessage: row.response_message,
    createdAt: row.created_at,
})

/** Stop automatic retries after this many attempts; the user can still retry manually. */
export const MAX_AUTOMATIC_ATTEMPTS = 10

export const listTransmissions = async (
    supabase: SupabaseClient,
    organizationId: string,
    params: { status?: TransmissionStatus; from: number; to: number },
): Promise<Collection<EisTransmission>> => {
    let request = supabase
        .from('eis_transmissions')
        .select('*, invoices(invoice_number, document_type)', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(params.from, params.to)
    if (params.status) request = request.eq('status', params.status)
    const { data, error, count } = await request.returns<TransmissionRow[]>()
    if (error) throw error
    return { total: count ?? 0, records: data.map(toTransmission) }
}

/** Sends one queued, failed or rejected transmission and records BIR's response. */
export const transmitOne = async (supabase: SupabaseClient, organizationId: string, transmissionId: string) => {
    const { data: row, error } = await supabase
        .from('eis_transmissions')
        .select('id, invoice_id, status, attempts')
        .eq('id', transmissionId)
        .eq('organization_id', organizationId)
        .single<{ id: string; invoice_id: string; status: TransmissionStatus; attempts: number }>()
    if (error) throw error
    if (row.status === 'accepted' || row.status === 'cancelled') return row.status

    const invoice = await getInvoiceDetails(supabase, organizationId, row.invoice_id)
    const payload = buildEisPayload(invoice)
    const result = await getEisProvider().transmit(payload)

    const { error: updateError } = await supabase
        .from('eis_transmissions')
        .update({
            status: result.status,
            attempts: row.attempts + 1,
            last_attempt_at: new Date().toISOString(),
            bir_reference: result.birReference,
            response_code: result.responseCode,
            response_message: result.responseMessage,
            payload_hash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
        })
        .eq('id', row.id)
    if (updateError) throw updateError
    return result.status
}

/** Sends every pending transmission of an organization (oldest deadline first). */
export const transmitPending = async (supabase: SupabaseClient, organizationId: string, limit = 50) => {
    const { data, error } = await supabase
        .from('eis_transmissions')
        .select('id')
        .eq('organization_id', organizationId)
        .in('status', ['queued', 'failed'])
        .lt('attempts', MAX_AUTOMATIC_ATTEMPTS)
        .order('due_at')
        .limit(limit)
        .returns<{ id: string }[]>()
    if (error) throw error

    const summary = { accepted: 0, rejected: 0, failed: 0 }
    for (const { id } of data) {
        const status = await transmitOne(supabase, organizationId, id)
        if (status === 'accepted' || status === 'rejected' || status === 'failed') summary[status] += 1
    }
    return summary
}
