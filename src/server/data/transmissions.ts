import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import dayjs from 'dayjs'
import { getInvoiceDetails } from '@/server/data/invoices'
import { getEisGateway } from '@/server/eis'
import { EisApiError } from '@/server/eis/BirEisGateway'
import { generateEisUniqueId } from '@/server/eis/crypto'
import { buildEisDocuments, getEisDocumentProblems } from '@/server/eis/format'
import { EIS_MAX_INVOICES_PER_SUBMISSION, type TransmissionStatus } from '@/constants/bir.constant'
import type { Collection } from '@/@types/collections'
import type { EisTransmission } from '@/@types/transmissions/EisTransmission'
import type { EisCasInvoice, EisGateway, EisOutgoingDocument, EisTransClass } from '@/server/eis/types'

// The EIS transmission job. Each issued document (eis_transmissions) becomes one e-invoice per tax
// classification (eis_documents). Pending e-invoices are signed and sent in batches of up to 100 (one
// eis_submissions row per Invoice Issuance call); results are collected later with the Inquiry Result API,
// because the EIS registers transmissions asynchronously ("within the next business day").

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
    eis_documents: DocumentSummaryRow[] | null
}

interface DocumentSummaryRow {
    eis_unique_id: string
    trans_class: EisTransClass
    status: TransmissionStatus
    result_code: string | null
    result_message: string | null
}

interface DocumentRow extends DocumentSummaryRow {
    id: string
    transmission_id: string
    accreditation_id: string
    payload: EisCasInvoice
    submission_id: string | null
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
    documents: (row.eis_documents ?? [])
        .map((document) => ({
            uniqueId: document.eis_unique_id,
            transClass: document.trans_class,
            status: document.status,
            resultCode: document.result_code,
            resultMessage: document.result_message,
        }))
        .sort((a, b) => a.transClass.localeCompare(b.transClass)),
})

/** Stop automatic retries after this many attempts; the user can still retry manually. */
export const MAX_AUTOMATIC_ATTEMPTS = 10

/** Transmissions claimed per run. */
const CLAIM_LIMIT = 50

/** Submissions whose results are collected per run. */
const INQUIRY_LIMIT = 20

/** Results for these codes mean BIR registered the e-invoice (SYN003: already registered by an earlier send). */
const REGISTERED_CODES = ['SUC001', 'SYN003']

export const listTransmissions = async (
    supabase: SupabaseClient,
    organizationId: string,
    params: { status?: TransmissionStatus; from: number; to: number },
): Promise<Collection<EisTransmission>> => {
    let request = supabase
        .from('eis_transmissions')
        .select(
            '*, invoices(invoice_number, document_type), ' +
                'eis_documents(eis_unique_id, trans_class, status, result_code, result_message)',
            { count: 'exact' },
        )
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(params.from, params.to)
    if (params.status) request = request.eq('status', params.status)
    const { data, error, count } = await request.returns<TransmissionRow[]>()
    if (error) throw error
    return { total: count ?? 0, records: data.map(toTransmission) }
}

export interface EisRunSummary {
    /** e-Invoices sent to the EIS in this run. */
    sent: number
    accepted: number
    rejected: number
    failed: number
    cancelled: number
    /** Set when nothing could be sent (e.g. no EIS connection). */
    message: string | null
}

const emptySummary = (): EisRunSummary => ({
    sent: 0,
    accepted: 0,
    rejected: 0,
    failed: 0,
    cancelled: 0,
    message: null,
})

const errorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Unexpected error while transmitting to the EIS.'

/** Sets a transmission's status from its e-invoices (a mixed document is accepted only when all parts are). */
const refreshTransmission = async (
    admin: SupabaseClient,
    transmissionId: string,
    update: { countAttempt?: boolean; message?: string | null } = {},
) => {
    const [{ data: transmission, error: readError }, { data: documents, error: documentsError }] = await Promise.all([
        admin.from('eis_transmissions').select('attempts').eq('id', transmissionId).single<{ attempts: number }>(),
        admin
            .from('eis_documents')
            .select('eis_unique_id, trans_class, status, result_code, result_message')
            .eq('transmission_id', transmissionId)
            .returns<DocumentSummaryRow[]>(),
    ])
    if (readError) throw readError
    if (documentsError) throw documentsError

    const statuses = documents.map((document) => document.status)
    const status: TransmissionStatus =
        statuses.length === 0
            ? 'queued'
            : statuses.every((value) => value === 'accepted')
              ? 'accepted'
              : statuses.includes('rejected')
                ? 'rejected'
                : statuses.includes('failed')
                  ? 'failed'
                  : statuses.includes('queued')
                    ? 'queued'
                    : 'sent'

    const problems = documents
        .filter((document) => document.status === 'rejected' || document.status === 'failed')
        .map((document) =>
            [document.trans_class, document.result_code, document.result_message].filter(Boolean).join(' '),
        )
    const message =
        update.message ??
        (status === 'accepted'
            ? 'Registered by BIR.'
            : status === 'sent'
              ? 'Received by the EIS; waiting for BIR to register it.'
              : problems.join(' | ') || null)

    const { error } = await admin
        .from('eis_transmissions')
        .update({
            status,
            claimed_at: null,
            bir_reference: documents.map((document) => document.eis_unique_id).join(', ') || null,
            response_code: documents.find((document) => document.result_code)?.result_code ?? null,
            response_message: message,
            ...(update.countAttempt
                ? { attempts: transmission.attempts + 1, last_attempt_at: new Date().toISOString() }
                : {}),
        })
        .eq('id', transmissionId)
    if (error) throw error
    return status
}

/** Ends a claim without sending (the transmission is picked up again by a later run). */
const releaseTransmission = async (admin: SupabaseClient, transmissionId: string, message?: string) => {
    const { error } = await admin
        .from('eis_transmissions')
        .update({ claimed_at: null, ...(message ? { response_message: message } : {}) })
        .eq('id', transmissionId)
    if (error) throw error
}

const finishTransmission = async (
    admin: SupabaseClient,
    transmissionId: string,
    status: 'failed' | 'rejected' | 'cancelled',
    message: string,
    countAttempt: boolean,
) => {
    const { data: row, error: readError } = await admin
        .from('eis_transmissions')
        .select('attempts')
        .eq('id', transmissionId)
        .single<{ attempts: number }>()
    if (readError) throw readError
    const { error } = await admin
        .from('eis_transmissions')
        .update({
            status,
            claimed_at: null,
            response_message: message,
            ...(countAttempt ? { attempts: row.attempts + 1, last_attempt_at: new Date().toISOString() } : {}),
        })
        .eq('id', transmissionId)
    if (error) throw error
}

interface Outgoing extends EisOutgoingDocument {
    id: string
    transmissionId: string
}

/**
 * Builds (or rebuilds) the e-invoices of one claimed transmission and returns those still to be sent.
 * Returns null when the transmission was cancelled, deferred or failed here.
 */
const prepareTransmission = async (
    admin: SupabaseClient,
    gateway: EisGateway,
    organizationId: string,
    sellerEmail: string | null,
    transmissionId: string,
    invoiceId: string,
    summary: EisRunSummary,
): Promise<Outgoing[] | null> => {
    const invoice = await getInvoiceDetails(admin, organizationId, invoiceId)

    const { data: existing, error: existingError } = await admin
        .from('eis_documents')
        .select(
            'id, transmission_id, eis_unique_id, trans_class, status, accreditation_id, submission_id, payload, result_code, result_message',
        )
        .eq('transmission_id', transmissionId)
        .returns<DocumentRow[]>()
    if (existingError) throw existingError

    let referenceUniqueIds: Partial<Record<EisTransClass, string>> | undefined
    if (invoice.referenceInvoice) {
        const { data: reference, error } = await admin
            .from('eis_transmissions')
            .select('id, status, eis_documents(eis_unique_id, trans_class, status)')
            .eq('invoice_id', invoice.referenceInvoice.id)
            .maybeSingle<{ id: string; status: TransmissionStatus; eis_documents: DocumentSummaryRow[] }>()
        if (error) throw error
        if (!reference || reference.status === 'cancelled') {
            // JSON format field 8(b): an adjustment of a document issued before the PTT is not transmitted
            await finishTransmission(
                admin,
                transmissionId,
                'cancelled',
                `Not transmitted: the adjusted document ${invoice.referenceInvoice.invoiceNumber ?? ''} was not transmitted to the EIS (issued before the Permit to Transmit).`,
                false,
            )
            summary.cancelled += 1
            return null
        }
        const sent = reference.eis_documents.filter((document) => ['sent', 'accepted'].includes(document.status))
        if (sent.length === 0) {
            await releaseTransmission(
                admin,
                transmissionId,
                `Waiting for ${invoice.referenceInvoice.invoiceNumber ?? 'the adjusted document'} to be transmitted first.`,
            )
            return null
        }
        referenceUniqueIds = Object.fromEntries(sent.map((document) => [document.trans_class, document.eis_unique_id]))
    }

    const byClass = new Map(existing.map((document) => [document.trans_class, document]))
    const built = buildEisDocuments(invoice, {
        sellerEmail,
        referenceUniqueIds,
        uniqueIdFor: (transClass) => {
            const previous = byClass.get(transClass)
            // Keep the ID across retries; a new EIS Cert Number (sandbox → production) needs a new one
            return previous && previous.accreditation_id === gateway.accreditationId
                ? previous.eis_unique_id
                : generateEisUniqueId(invoice.invoiceDate, gateway.accreditationId)
        },
    })

    const problems = built.flatMap(({ transClass, document }) =>
        getEisDocumentProblems(document, gateway.accreditationId).map((problem) => `${transClass}: ${problem}`),
    )
    if (problems.length) {
        await finishTransmission(admin, transmissionId, 'rejected', `Not sent — ${problems.join(' ')}`, true)
        summary.rejected += 1
        return null
    }

    // Parts already sent or registered are never sent again
    const toSend = built.filter(({ transClass }) => {
        const status = byClass.get(transClass)?.status
        return status !== 'sent' && status !== 'accepted'
    })
    if (toSend.length === 0) {
        await refreshTransmission(admin, transmissionId)
        return null
    }

    const { data: saved, error } = await admin
        .from('eis_documents')
        .upsert(
            toSend.map(({ transClass, document }) => ({
                organization_id: organizationId,
                transmission_id: transmissionId,
                invoice_id: invoice.id,
                trans_class: transClass,
                eis_unique_id: document.EisUniqueId,
                accreditation_id: gateway.accreditationId,
                payload: document,
                status: 'queued',
                submission_id: null,
                result_code: null,
                result_message: null,
            })),
            { onConflict: 'transmission_id,trans_class' },
        )
        .select('id, trans_class')
        .returns<{ id: string; trans_class: EisTransClass }[]>()
    if (error) throw error

    return toSend.map(({ transClass, document }) => ({
        id: saved.find((row) => row.trans_class === transClass)!.id,
        transmissionId,
        uniqueId: document.EisUniqueId,
        document,
    }))
}

/** Claims pending transmissions, builds their e-invoices and sends them in batches of up to 100. */
const sendPending = async (
    admin: SupabaseClient,
    gateway: EisGateway,
    organizationId: string,
    transmissionId: string | undefined,
    summary: EisRunSummary,
) => {
    const { data: claimed, error: claimError } = await admin.rpc('claim_eis_transmissions', {
        p_organization_id: organizationId,
        p_limit: transmissionId ? 1 : CLAIM_LIMIT,
        p_max_attempts: MAX_AUTOMATIC_ATTEMPTS,
        p_transmission_id: transmissionId ?? null,
    })
    if (claimError) throw claimError
    const ids = (claimed ?? []) as string[]
    if (ids.length === 0) return

    const [{ data: organization, error: organizationError }, { data: rows, error: rowsError }] = await Promise.all([
        admin.from('organizations').select('email').eq('id', organizationId).single<{ email: string | null }>(),
        admin
            .from('eis_transmissions')
            .select('id, invoice_id')
            .in('id', ids)
            .order('due_at')
            .returns<{ id: string; invoice_id: string }[]>(),
    ])
    if (organizationError) throw organizationError
    if (rowsError) throw rowsError

    const outgoing: Outgoing[] = []
    for (const row of rows) {
        try {
            const prepared = await prepareTransmission(
                admin,
                gateway,
                organizationId,
                organization.email,
                row.id,
                row.invoice_id,
                summary,
            )
            if (prepared) outgoing.push(...prepared)
        } catch (error) {
            await finishTransmission(admin, row.id, 'failed', errorMessage(error), true)
            summary.failed += 1
        }
    }

    const batches: Outgoing[][] = []
    for (let index = 0; index < outgoing.length; index += EIS_MAX_INVOICES_PER_SUBMISSION) {
        batches.push(outgoing.slice(index, index + EIS_MAX_INVOICES_PER_SUBMISSION))
    }
    // The sandbox accepts one Invoice Issuance call per 10 seconds (error E19): send one batch per run there
    const sendable = !gateway.simulated && gateway.environment === 'sandbox' ? batches.slice(0, 1) : batches

    let stopReason: string | null = null
    for (const batch of sendable) {
        const transmissionIds = [...new Set(batch.map((document) => document.transmissionId))]
        if (stopReason) {
            await Promise.all(transmissionIds.map((id) => releaseTransmission(admin, id, stopReason ?? undefined)))
            continue
        }
        try {
            const ack = await gateway.submit(batch)
            const { data: submission, error } = await admin
                .from('eis_submissions')
                .insert({
                    organization_id: organizationId,
                    environment: gateway.environment,
                    simulated: gateway.simulated,
                    accreditation_id: gateway.accreditationId,
                    submit_id: ack.submitId,
                    ack_id: ack.ackId || null,
                    document_count: batch.length,
                    response_message: ack.description,
                    // BIR registers asynchronously; ask for the result a few minutes later
                    next_check_at: gateway.simulated
                        ? new Date().toISOString()
                        : dayjs().add(5, 'minute').toISOString(),
                })
                .select('id')
                .single<{ id: string }>()
            if (error) throw error
            const { error: documentsError } = await admin
                .from('eis_documents')
                .update({ status: 'sent', submission_id: submission.id, result_code: null, result_message: null })
                .in(
                    'id',
                    batch.map((document) => document.id),
                )
            if (documentsError) throw documentsError
            summary.sent += batch.length
        } catch (error) {
            const configuration = error instanceof EisApiError && error.isConfiguration
            const message = errorMessage(error)
            const { error: documentsError } = await admin
                .from('eis_documents')
                .update({
                    status: 'failed',
                    result_code: error instanceof EisApiError ? error.code : null,
                    result_message: message,
                })
                .in(
                    'id',
                    batch.map((document) => document.id),
                )
            if (documentsError) throw documentsError
            summary.failed += transmissionIds.length
            // Wrong credentials: stop here and do not use up the automatic attempts
            if (configuration) stopReason = `EIS connection problem — ${message}`
            await Promise.all(
                transmissionIds.map((id) => refreshTransmission(admin, id, { countAttempt: !configuration, message })),
            )
            continue
        }
        await Promise.all(transmissionIds.map((id) => refreshTransmission(admin, id, { countAttempt: true })))
    }

    for (const batch of batches.slice(sendable.length)) {
        const transmissionIds = [...new Set(batch.map((document) => document.transmissionId))]
        await Promise.all(transmissionIds.map((id) => releaseTransmission(admin, id)))
    }
}

/** Minutes until the next result inquiry: 5, 10, 20, 40 … capped at 4 hours. */
const nextCheckDelay = (attempts: number) => Math.min(5 * 2 ** attempts, 240)

/** Collects the processing results of submissions that are due for an inquiry. */
const collectResults = async (
    admin: SupabaseClient,
    gateway: EisGateway,
    organizationId: string,
    summary: EisRunSummary,
) => {
    const { data: submissions, error } = await admin
        .from('eis_submissions')
        .select('id, submit_id, check_attempts')
        .eq('organization_id', organizationId)
        .eq('status', 'processing')
        .eq('simulated', gateway.simulated)
        .lte('next_check_at', new Date().toISOString())
        .order('next_check_at')
        .limit(INQUIRY_LIMIT)
        .returns<{ id: string; submit_id: string; check_attempts: number }[]>()
    if (error) throw error

    for (const submission of submissions) {
        const { data: documents, error: documentsError } = await admin
            .from('eis_documents')
            .select('id, transmission_id, eis_unique_id, payload')
            .eq('submission_id', submission.id)
            .returns<Pick<DocumentRow, 'id' | 'transmission_id' | 'eis_unique_id' | 'payload'>[]>()
        if (documentsError) throw documentsError

        const later = (message?: string) =>
            admin
                .from('eis_submissions')
                .update({
                    check_attempts: submission.check_attempts + 1,
                    next_check_at: dayjs().add(nextCheckDelay(submission.check_attempts), 'minute').toISOString(),
                    ...(message ? { response_message: message } : {}),
                })
                .eq('id', submission.id)

        let result
        try {
            result = await gateway.inquire(
                submission.submit_id,
                documents.map((document) => ({ uniqueId: document.eis_unique_id, document: document.payload })),
            )
        } catch (inquiryError) {
            const { error: updateError } = await later(`Result inquiry failed: ${errorMessage(inquiryError)}`)
            if (updateError) throw updateError
            continue
        }

        if (result.state === 'processing') {
            const { error: updateError } = await later()
            if (updateError) throw updateError
            continue
        }

        const now = new Date().toISOString()
        if (result.state === 'unavailable') {
            // Nothing was registered: the e-invoices are sent again in a new submission
            const message = `${result.code}: ${result.message}`
            const { error: submissionError } = await admin
                .from('eis_submissions')
                .update({
                    status: 'unavailable',
                    response_code: result.code,
                    response_message: message,
                    completed_at: now,
                })
                .eq('id', submission.id)
            if (submissionError) throw submissionError
            const { error: failError } = await admin
                .from('eis_documents')
                .update({ status: 'failed', result_code: result.code, result_message: message })
                .eq('submission_id', submission.id)
            if (failError) throw failError
        } else {
            const byId = new Map(result.documents.map((item) => [item.uniqueId, item]))
            let success = 0
            for (const document of documents) {
                const item = byId.get(document.eis_unique_id)
                const accepted = !!item && REGISTERED_CODES.includes(item.code)
                if (accepted) success += 1
                const { error: updateError } = await admin
                    .from('eis_documents')
                    .update({
                        status: item ? (accepted ? 'accepted' : 'rejected') : 'failed',
                        result_code: item?.code ?? null,
                        result_message: item
                            ? item.description
                            : 'The EIS returned no result for this e-invoice; it will be sent again.',
                    })
                    .eq('id', document.id)
                if (updateError) throw updateError
            }
            const { error: updateError } = await admin
                .from('eis_submissions')
                .update({
                    status: 'completed',
                    response_code: '01',
                    success_count: success,
                    fail_count: documents.length - success,
                    completed_at: now,
                })
                .eq('id', submission.id)
            if (updateError) throw updateError
        }

        for (const transmissionId of new Set(documents.map((document) => document.transmission_id))) {
            const status = await refreshTransmission(admin, transmissionId)
            if (status === 'accepted') summary.accepted += 1
            else if (status === 'rejected') summary.rejected += 1
            else if (status === 'failed') summary.failed += 1
        }
    }
}

/**
 * Runs the EIS job for one organization: sends pending documents (or only `transmissionId`, a manual
 * retry) and collects due results. Uses the admin client — check the user's permission before calling.
 */
export const runEisTransmissions = async (
    admin: SupabaseClient,
    organizationId: string,
    options: { transmissionId?: string } = {},
): Promise<EisRunSummary> => {
    const summary = emptySummary()
    const gateway = await getEisGateway(admin, organizationId)
    if (!gateway) {
        summary.message = 'The EIS connection is not set up. Enter the credentials from the EIS Certification portal.'
        return summary
    }
    await sendPending(admin, gateway, organizationId, options.transmissionId, summary)
    await collectResults(admin, gateway, organizationId, summary)
    return summary
}

/** Organizations the scheduled job should visit. */
export const listOrganizationsWithEisWork = async (admin: SupabaseClient) => {
    const { data, error } = await admin.rpc('eis_pending_organizations', { p_max_attempts: MAX_AUTOMATIC_ATTEMPTS })
    if (error) throw error
    return [...new Set((data ?? []) as string[])]
}
