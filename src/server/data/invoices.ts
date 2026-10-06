import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import type { ApiSession } from '@/server/routes/api'
import { toSearchPattern } from '@/server/routes/api'
import { getOrganization } from '@/server/data/organizations'
import { getMemberNames } from '@/server/data/members'
import { calculateInvoice } from '@/utils/invoices/calculateInvoice'
import { getInvoiceIssueProblems } from '@/utils/invoices/validateInvoice'
import { todayInManila } from '@/utils/date'
import { hasAuthorityTo } from '@/utils/hasAuthority'
import { ACTION_MEMO_ISSUE } from '@/constants/actions.constant'
import { isMemoDocumentType, type SpecialDiscountType, type TransmissionStatus } from '@/constants/bir.constant'
import { DataError, ForbiddenError, NotFoundError } from '@/@types/errors'
import type { Collection } from '@/@types/collections'
import type { Invoice } from '@/@types/invoices/Invoice'
import type { InvoiceDetails, InvoiceReference } from '@/@types/invoices/InvoiceDetails'
import type { InvoiceLine } from '@/@types/invoices/InvoiceLine'
import type { InvoicesParams } from '@/@types/invoices'
import type { InvoicePayload } from '@/@types/invoices/forms/InvoiceFormData'

type Numeric = number | string

interface InvoiceRow {
    id: string
    organization_id: string
    branch_id: string
    document_type: Invoice['documentType']
    status: Invoice['status']
    invoice_number: string | null
    invoice_date: string
    due_date: string | null
    customer_id: string | null
    buyer_name: string | null
    buyer_business_name: string | null
    buyer_tin: string | null
    currency: 'PHP'
    gross_amount: Numeric
    discount_amount: Numeric
    special_discount_amount: Numeric
    vatable_sales: Numeric
    vat_amount: Numeric
    zero_rated_sales: Numeric
    vat_exempt_sales: Numeric
    non_vat_sales: Numeric
    total_amount: Numeric
    withholding_tax_amount: Numeric
    amount_due: Numeric
    issued_at: string | null
    voided_at: string | null
    created_at: string
    updated_at: string
    branches: { code: string } | null
    eis_transmissions: { status: TransmissionStatus } | { status: TransmissionStatus }[] | null
}

interface InvoiceDetailsRow extends InvoiceRow {
    payment_terms: string | null
    buyer_branch_code: string | null
    buyer_address: string | null
    buyer_email: string | null
    buyer_is_vat_registered: boolean
    prices_include_vat: boolean
    withholding_tax_rate: Numeric
    special_discount_type: SpecialDiscountType | null
    special_discount_id_number: string | null
    special_discount_holder_name: string | null
    special_discount_holder_tin: string | null
    reference_invoice_id: string | null
    adjustment_reason: string | null
    manual_invoice_reference: string | null
    notes: string | null
    seller_registered_name: string | null
    seller_business_name: string | null
    seller_tin: string | null
    seller_branch_code: string | null
    seller_address: string | null
    seller_vat_registration: 'vat' | 'non_vat' | null
    ac_number: string | null
    ac_date: string | null
    series_range: string | null
    pti_number: string | null
    integrity_hash: string | null
    print_count: number
    issued_by: string | null
    voided_by: string | null
    void_reason: string | null
    created_by: string
    invoice_lines: InvoiceLineRow[]
}

interface InvoiceLineRow {
    id: string
    line_number: number
    product_id: string | null
    description: string
    unit: string
    quantity: Numeric
    unit_price: Numeric
    discount_amount: Numeric
    special_discount: boolean
    tax_treatment: InvoiceLine['taxTreatment']
    gross_amount: Numeric
    special_discount_amount: Numeric
    net_amount: Numeric
    vat_amount: Numeric
    total_amount: Numeric
}

const LIST_SELECT =
    'id, organization_id, branch_id, document_type, status, invoice_number, invoice_date, due_date, customer_id, ' +
    'buyer_name, buyer_business_name, buyer_tin, currency, gross_amount, discount_amount, special_discount_amount, ' +
    'vatable_sales, vat_amount, zero_rated_sales, vat_exempt_sales, non_vat_sales, total_amount, ' +
    'withholding_tax_amount, amount_due, issued_at, voided_at, created_at, updated_at, ' +
    'branches(code), eis_transmissions(status)'

const DETAILS_SELECT = '*, branches(code), eis_transmissions(status), invoice_lines(*)'

const n = (value: Numeric | null | undefined) => Number(value ?? 0)

const transmissionStatus = (value: InvoiceRow['eis_transmissions']) =>
    (Array.isArray(value) ? value[0]?.status : value?.status) ?? null

const toInvoice = (row: InvoiceRow): Invoice => ({
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    branchCode: row.branches?.code ?? '',
    documentType: row.document_type,
    status: row.status,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    customerId: row.customer_id,
    buyerName: row.buyer_name || row.buyer_business_name || 'Walk-in customer',
    buyerTin: row.buyer_tin,
    currency: 'PHP',
    grossAmount: n(row.gross_amount),
    discountAmount: n(row.discount_amount),
    specialDiscountAmount: n(row.special_discount_amount),
    vatableSales: n(row.vatable_sales),
    vatAmount: n(row.vat_amount),
    zeroRatedSales: n(row.zero_rated_sales),
    vatExemptSales: n(row.vat_exempt_sales),
    nonVatSales: n(row.non_vat_sales),
    totalAmount: n(row.total_amount),
    withholdingTaxAmount: n(row.withholding_tax_amount),
    amountDue: n(row.amount_due),
    transmissionStatus: transmissionStatus(row.eis_transmissions),
    issuedAt: row.issued_at,
    voidedAt: row.voided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
})

const toLine = (row: InvoiceLineRow): InvoiceLine => ({
    id: row.id,
    lineNumber: row.line_number,
    productId: row.product_id,
    description: row.description,
    unit: row.unit,
    quantity: n(row.quantity),
    unitPrice: n(row.unit_price),
    discountAmount: n(row.discount_amount),
    specialDiscount: row.special_discount,
    taxTreatment: row.tax_treatment,
    grossAmount: n(row.gross_amount),
    specialDiscountAmount: n(row.special_discount_amount),
    netAmount: n(row.net_amount),
    vatAmount: n(row.vat_amount),
    totalAmount: n(row.total_amount),
})

const toReference = (row: {
    id: string
    invoice_number: string | null
    invoice_date: string
    document_type: Invoice['documentType']
    total_amount: Numeric
}): InvoiceReference => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    documentType: row.document_type,
    totalAmount: n(row.total_amount),
})

export const listInvoices = async (
    supabase: ServerSupabase,
    organizationId: string,
    params: InvoicesParams & { from: number; to: number },
): Promise<Collection<Invoice>> => {
    let request = supabase
        .from('invoices')
        .select(LIST_SELECT, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('invoice_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(params.from, params.to)

    if (params.status) request = request.eq('status', params.status)
    if (params.documentType) request = request.eq('document_type', params.documentType)
    if (params.branchId) request = request.eq('branch_id', params.branchId)
    if (params.customerId) request = request.eq('customer_id', params.customerId)
    if (params.dateFrom) request = request.gte('invoice_date', params.dateFrom)
    if (params.dateTo) request = request.lte('invoice_date', params.dateTo)
    if (params.query) {
        const pattern = toSearchPattern(params.query)
        request = request.or(
            `invoice_number.ilike.${pattern},buyer_name.ilike.${pattern},buyer_business_name.ilike.${pattern},buyer_tin.ilike.${pattern}`,
        )
    }

    const { data, error, count } = await request.returns<InvoiceRow[]>()
    if (error) throw error
    return { total: count ?? 0, records: data.map(toInvoice) }
}

export const getInvoiceDetails = async (
    supabase: ServerSupabase,
    organizationId: string,
    invoiceId: string,
): Promise<InvoiceDetails> => {
    const { data: row, error } = await supabase
        .from('invoices')
        .select(DETAILS_SELECT)
        .eq('id', invoiceId)
        .eq('organization_id', organizationId)
        .maybeSingle<InvoiceDetailsRow>()
    if (error) throw error
    if (!row) throw new NotFoundError('Document not found.')

    const [referenceResult, adjustmentsResult, names] = await Promise.all([
        row.reference_invoice_id
            ? supabase
                  .from('invoices')
                  .select('id, invoice_number, invoice_date, document_type, total_amount')
                  .eq('id', row.reference_invoice_id)
                  .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        supabase
            .from('invoices')
            .select('id, invoice_number, invoice_date, document_type, total_amount')
            .eq('reference_invoice_id', row.id)
            .neq('status', 'draft')
            .order('issued_at'),
        getMemberNames(
            supabase,
            organizationId,
            [row.issued_by, row.voided_by, row.created_by].filter((id): id is string => !!id),
        ),
    ])
    if (referenceResult.error) throw referenceResult.error
    if (adjustmentsResult.error) throw adjustmentsResult.error

    return {
        ...toInvoice(row),
        seller: row.seller_tin
            ? {
                  registeredName: row.seller_registered_name ?? '',
                  businessName: row.seller_business_name,
                  tin: row.seller_tin,
                  branchCode: row.seller_branch_code ?? '',
                  address: row.seller_address ?? '',
                  vatRegistration: row.seller_vat_registration ?? 'vat',
                  acNumber: row.ac_number,
                  acDate: row.ac_date,
                  seriesRange: row.series_range,
                  ptiNumber: row.pti_number,
              }
            : null,
        buyer: {
            name: row.buyer_name ?? '',
            businessName: row.buyer_business_name,
            tin: row.buyer_tin,
            branchCode: row.buyer_branch_code,
            address: row.buyer_address,
            email: row.buyer_email,
        },
        lines: (row.invoice_lines ?? []).map(toLine).sort((a, b) => a.lineNumber - b.lineNumber),
        pricesIncludeVat: row.prices_include_vat,
        paymentTerms: row.payment_terms,
        withholdingTaxRate: n(row.withholding_tax_rate),
        specialDiscount:
            row.special_discount_type && row.special_discount_id_number
                ? {
                      type: row.special_discount_type,
                      idNumber: row.special_discount_id_number,
                      holderName: row.special_discount_holder_name ?? '',
                      holderTin: row.special_discount_holder_tin,
                  }
                : null,
        referenceInvoice: referenceResult.data ? toReference(referenceResult.data) : null,
        adjustmentReason: row.adjustment_reason,
        manualInvoiceReference: row.manual_invoice_reference,
        notes: row.notes,
        adjustments: (adjustmentsResult.data ?? []).map(toReference),
        integrityHash: row.integrity_hash,
        printCount: row.print_count,
        issuedByName: row.issued_by ? (names.get(row.issued_by) ?? null) : null,
        voidReason: row.void_reason,
        voidedByName: row.voided_by ? (names.get(row.voided_by) ?? null) : null,
        createdByName: names.get(row.created_by) ?? null,
    }
}

/**
 * Creates or updates a draft. Line amounts are always recalculated here from quantities and prices — the
 * client's preview values are ignored.
 */
export const saveInvoiceDraft = async (session: ApiSession, payload: InvoicePayload, invoiceId?: string) => {
    const { supabase, organizationId, role } = session

    if (isMemoDocumentType(payload.documentType) && !hasAuthorityTo(role, ACTION_MEMO_ISSUE)) {
        throw new ForbiddenError('Only owners, administrators and accountants can create credit or debit memos.')
    }

    const organization = await getOrganization(supabase, organizationId)

    let buyerIsVatRegistered = false
    if (payload.customerId) {
        const { data: customer, error } = await supabase
            .from('customers')
            .select('is_vat_registered')
            .eq('id', payload.customerId)
            .eq('organization_id', organizationId)
            .maybeSingle<{ is_vat_registered: boolean }>()
        if (error) throw error
        if (!customer) throw new DataError('The selected customer was not found.')
        buyerIsVatRegistered = customer.is_vat_registered
    }

    const specialDiscount = payload.specialDiscount ?? null
    const { lines } = calculateInvoice({
        lines: payload.lines,
        pricesIncludeVat: payload.pricesIncludeVat,
        sellerVatRegistration: organization.vatRegistration,
        specialDiscountType: specialDiscount?.type ?? null,
        withholdingTaxRate: payload.withholdingTaxRate,
    })

    const invoiceRow = {
        organization_id: organizationId,
        branch_id: payload.branchId,
        document_type: payload.documentType,
        invoice_date: payload.invoiceDate,
        due_date: payload.dueDate,
        payment_terms: payload.paymentTerms,
        customer_id: payload.customerId ?? null,
        buyer_name: payload.buyer.name,
        buyer_business_name: payload.buyer.businessName,
        buyer_tin: payload.buyer.tin,
        buyer_branch_code: payload.buyer.branchCode,
        buyer_address: payload.buyer.address,
        buyer_email: payload.buyer.email,
        buyer_is_vat_registered: buyerIsVatRegistered,
        prices_include_vat: payload.pricesIncludeVat,
        withholding_tax_rate: payload.withholdingTaxRate,
        special_discount_type: specialDiscount?.type ?? null,
        special_discount_id_number: specialDiscount?.idNumber ?? null,
        special_discount_holder_name: specialDiscount?.holderName ?? null,
        special_discount_holder_tin: specialDiscount?.holderTin ?? null,
        reference_invoice_id: isMemoDocumentType(payload.documentType) ? (payload.referenceInvoiceId ?? null) : null,
        adjustment_reason: isMemoDocumentType(payload.documentType) ? payload.adjustmentReason : null,
        manual_invoice_reference: payload.manualInvoiceReference,
        notes: payload.notes,
    }

    const lineRows = payload.lines.map((line, index) => ({
        line_number: index + 1,
        product_id: line.productId ?? null,
        description: line.description,
        unit: line.unit,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        discount_amount: lines[index].discountAmount,
        special_discount: !!line.specialDiscount && !!specialDiscount,
        tax_treatment: lines[index].taxTreatment,
        gross_amount: lines[index].grossAmount,
        special_discount_amount: lines[index].specialDiscountAmount,
        net_amount: lines[index].netAmount,
        vat_amount: lines[index].vatAmount,
        total_amount: lines[index].totalAmount,
    }))

    const { data: savedId, error } = await supabase.rpc('save_invoice_draft', {
        p_invoice_id: invoiceId ?? null,
        p_invoice: invoiceRow,
        p_lines: lineRows,
    })
    if (error) throw error

    return getInvoiceDetails(supabase, organizationId, savedId as string)
}

export const deleteInvoiceDraft = async (supabase: ServerSupabase, organizationId: string, invoiceId: string) => {
    const { data, error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('organization_id', organizationId)
        .eq('status', 'draft')
        .select('id')
    if (error) throw error
    if (!data?.length) throw new DataError('Only drafts can be deleted. Void issued documents instead.')
}

/** Runs the BIR pre-issue checks, then assigns the serial number in the database. */
export const issueInvoice = async (session: ApiSession, invoiceId: string) => {
    const { supabase, organizationId, role } = session
    const invoice = await getInvoiceDetails(supabase, organizationId, invoiceId)

    if (invoice.status !== 'draft') throw new DataError('This document has already been issued.')
    if (isMemoDocumentType(invoice.documentType) && !hasAuthorityTo(role, ACTION_MEMO_ISSUE)) {
        throw new ForbiddenError('Only owners, administrators and accountants can issue credit or debit memos.')
    }

    const organization = await getOrganization(supabase, organizationId)

    let buyerIsVatRegistered = false
    if (invoice.customerId) {
        const { data } = await supabase
            .from('customers')
            .select('is_vat_registered')
            .eq('id', invoice.customerId)
            .maybeSingle<{ is_vat_registered: boolean }>()
        buyerIsVatRegistered = data?.is_vat_registered ?? false
    }

    let referenceInvoice = null
    if (invoice.referenceInvoice) {
        const [{ data: reference }, { data: credits }] = await Promise.all([
            supabase
                .from('invoices')
                .select('status, document_type, total_amount')
                .eq('id', invoice.referenceInvoice.id)
                .single<{ status: string; document_type: Invoice['documentType']; total_amount: Numeric }>(),
            supabase
                .from('invoices')
                .select('total_amount')
                .eq('reference_invoice_id', invoice.referenceInvoice.id)
                .eq('document_type', 'credit_memo')
                .eq('status', 'issued')
                .returns<{ total_amount: Numeric }[]>(),
        ])
        if (reference) {
            referenceInvoice = {
                status: reference.status,
                documentType: reference.document_type,
                totalAmount: n(reference.total_amount),
                creditedAmount: (credits ?? []).reduce((sum, credit) => sum + n(credit.total_amount), 0),
            }
        }
    }

    const problems = getInvoiceIssueProblems({
        documentType: invoice.documentType,
        invoiceDate: invoice.invoiceDate,
        sellerVatRegistration: organization.vatRegistration,
        buyer: invoice.buyer,
        buyerIsVatRegistered,
        totalAmount: invoice.totalAmount,
        lines: invoice.lines,
        specialDiscount: invoice.specialDiscount,
        referenceInvoice,
        adjustmentReason: invoice.adjustmentReason,
        today: todayInManila(),
    })
    if (problems.length > 0) {
        throw new DataError(problems[0].message, problems)
    }

    const { error } = await supabase.rpc('issue_invoice', { p_invoice_id: invoiceId })
    if (error) throw error

    return getInvoiceDetails(supabase, organizationId, invoiceId)
}

export const voidInvoice = async (session: ApiSession, invoiceId: string, reason: string) => {
    const { supabase, organizationId } = session
    // Confirms the document belongs to this organization before calling the database function
    await getInvoiceDetails(supabase, organizationId, invoiceId)
    const { error } = await supabase.rpc('void_invoice', { p_invoice_id: invoiceId, p_reason: reason })
    if (error) throw error
    return getInvoiceDetails(supabase, organizationId, invoiceId)
}

/** Records a print and returns the copy number (1 = original, 2+ = reprint). */
export const recordInvoicePrint = async (supabase: ServerSupabase, invoiceId: string) => {
    const { data, error } = await supabase.rpc('record_invoice_print', { p_invoice_id: invoiceId })
    if (error) throw error
    return Number(data)
}
