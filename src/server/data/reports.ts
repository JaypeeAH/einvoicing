import 'server-only'

import dayjs from 'dayjs'
import type { ServerSupabase } from '@/server/supabase/server'
import { getOrganization } from '@/server/data/organizations'
import { listSeries } from '@/server/data/series'
import { listInvoices } from '@/server/data/invoices'
import { softwareName, softwareVersion } from '@/configs/app.config'
import {
    DOCUMENT_TYPE_LABELS,
    VAT_REGISTRATION_LABELS,
    type DocumentType,
    type InvoiceStatus,
} from '@/constants/bir.constant'
import { getRemainingSerials, isSeriesRunningLow } from '@/utils/invoices/invoiceNumber'
import { quarterRange, todayInManila, monthRange } from '@/utils/date'
import { roundMoney, sumMoney } from '@/utils/money'
import { formatTinWithBranch } from '@/utils/tin'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { DashboardSummary } from '@/@types/reports/DashboardSummary'
import type { ReportHeader, SalesAmounts, SalesJournal, SalesJournalRow } from '@/@types/reports/SalesJournal'
import type { SummaryListOfSales, SummaryListOfSalesRow } from '@/@types/reports/SummaryListOfSales'

type Numeric = number | string

interface ReportInvoiceRow {
    id: string
    invoice_date: string
    invoice_number: string
    document_type: DocumentType
    status: InvoiceStatus
    buyer_name: string | null
    buyer_business_name: string | null
    buyer_tin: string | null
    buyer_branch_code: string | null
    buyer_address: string | null
    gross_amount: Numeric
    discount_amount: Numeric
    special_discount_amount: Numeric
    vatable_sales: Numeric
    vat_amount: Numeric
    zero_rated_sales: Numeric
    vat_exempt_sales: Numeric
    non_vat_sales: Numeric
    total_amount: Numeric
    branches: { code: string } | null
    invoice_lines: { line_number: number; description: string }[]
}

const PAGE = 1000

/** Issued and voided documents in a date range (PostgREST returns at most 1,000 rows per request). */
const fetchReportInvoices = async (
    supabase: ServerSupabase,
    organizationId: string,
    range: { from: string; to: string; branchId?: string | null },
) => {
    const rows: ReportInvoiceRow[] = []
    for (let offset = 0; ; offset += PAGE) {
        let request = supabase
            .from('invoices')
            .select(
                'id, invoice_date, invoice_number, document_type, status, buyer_name, buyer_business_name, buyer_tin, ' +
                    'buyer_branch_code, buyer_address, gross_amount, discount_amount, special_discount_amount, ' +
                    'vatable_sales, vat_amount, zero_rated_sales, vat_exempt_sales, non_vat_sales, total_amount, ' +
                    'branches(code), invoice_lines(line_number, description)',
            )
            .eq('organization_id', organizationId)
            .neq('status', 'draft')
            .gte('invoice_date', range.from)
            .lte('invoice_date', range.to)
            .order('invoice_date')
            .order('invoice_number')
            .range(offset, offset + PAGE - 1)
        if (range.branchId) request = request.eq('branch_id', range.branchId)
        const { data, error } = await request.returns<ReportInvoiceRow[]>()
        if (error) throw error
        rows.push(...data)
        if (data.length < PAGE) break
    }
    return rows
}

const reportHeader = async (
    supabase: ServerSupabase,
    organizationId: string,
    user: SessionUser,
): Promise<ReportHeader> => {
    const organization = await getOrganization(supabase, organizationId)
    return {
        registeredName: organization.registeredName,
        businessName: organization.businessName,
        address: organization.registeredAddress,
        tin: formatTinWithBranch(organization.tin, '00000'),
        vatRegistration: VAT_REGISTRATION_LABELS[organization.vatRegistration],
        softwareName,
        softwareVersion,
        generatedAt: new Date().toISOString(),
        generatedBy: user.fullName || user.email,
    }
}

/** Credit memos reduce sales; voided documents stay in the book with zero amounts. */
const signedAmounts = (row: ReportInvoiceRow): SalesAmounts => {
    const sign = row.status === 'voided' ? 0 : row.document_type === 'credit_memo' ? -1 : 1
    const value = (amount: Numeric) => roundMoney(Number(amount) * sign)
    return {
        grossAmount: value(row.gross_amount),
        discountAmount: value(Number(row.discount_amount) + Number(row.special_discount_amount)),
        vatableSales: value(row.vatable_sales),
        vatAmount: value(row.vat_amount),
        zeroRatedSales: value(row.zero_rated_sales),
        vatExemptSales: value(row.vat_exempt_sales),
        nonVatSales: value(row.non_vat_sales),
        totalAmount: value(row.total_amount),
    }
}

const sumAmounts = (rows: SalesAmounts[]): SalesAmounts => ({
    grossAmount: sumMoney(rows.map((row) => row.grossAmount)),
    discountAmount: sumMoney(rows.map((row) => row.discountAmount)),
    vatableSales: sumMoney(rows.map((row) => row.vatableSales)),
    vatAmount: sumMoney(rows.map((row) => row.vatAmount)),
    zeroRatedSales: sumMoney(rows.map((row) => row.zeroRatedSales)),
    vatExemptSales: sumMoney(rows.map((row) => row.vatExemptSales)),
    nonVatSales: sumMoney(rows.map((row) => row.nonVatSales)),
    totalAmount: sumMoney(rows.map((row) => row.totalAmount)),
})

const describe = (row: ReportInvoiceRow) => {
    const lines = [...(row.invoice_lines ?? [])].sort((a, b) => a.line_number - b.line_number)
    const first = lines[0]?.description ?? DOCUMENT_TYPE_LABELS[row.document_type]
    const description = lines.length > 1 ? `${first} and ${lines.length - 1} more` : first
    return row.status === 'voided' ? `VOIDED — ${description}` : description
}

/** Sales Journal with the RR 9-2009 columns (date, customer TIN/name/address, description, amounts). */
export const getSalesJournal = async (
    supabase: ServerSupabase,
    organizationId: string,
    user: SessionUser,
    range: { from: string; to: string; branchId?: string | null },
): Promise<SalesJournal> => {
    const [header, invoices] = await Promise.all([
        reportHeader(supabase, organizationId, user),
        fetchReportInvoices(supabase, organizationId, range),
    ])
    const rows: SalesJournalRow[] = invoices.map((row) => ({
        id: row.id,
        invoiceDate: row.invoice_date,
        invoiceNumber: row.invoice_number,
        documentType: row.document_type,
        status: row.status,
        branchCode: row.branches?.code ?? '',
        buyerTin: row.buyer_tin ? formatTinWithBranch(row.buyer_tin, row.buyer_branch_code) : null,
        buyerName: row.buyer_name || row.buyer_business_name || 'Walk-in customer',
        buyerAddress: row.buyer_address,
        description: describe(row),
        ...signedAmounts(row),
    }))
    return { header, from: range.from, to: range.to, branchId: range.branchId ?? null, rows, totals: sumAmounts(rows) }
}

/** Summary List of Sales: quarterly totals per buyer TIN (RR 16-2005 as amended; filed via eSubmission). */
export const getSummaryListOfSales = async (
    supabase: ServerSupabase,
    organizationId: string,
    user: SessionUser,
    period: { year: number; quarter: 1 | 2 | 3 | 4 },
): Promise<SummaryListOfSales> => {
    const range = quarterRange(period.year, period.quarter)
    const [header, invoices] = await Promise.all([
        reportHeader(supabase, organizationId, user),
        fetchReportInvoices(supabase, organizationId, range),
    ])

    const groups = new Map<string, SummaryListOfSalesRow>()
    for (const invoice of invoices) {
        if (invoice.status === 'voided') continue
        const amounts = signedAmounts(invoice)
        const key = invoice.buyer_tin ?? '__no_tin__'
        const current =
            groups.get(key) ??
            ({
                buyerTin: invoice.buyer_tin,
                buyerName: invoice.buyer_tin
                    ? invoice.buyer_name || invoice.buyer_business_name || ''
                    : 'Sales to buyers without TIN',
                buyerAddress: invoice.buyer_tin ? invoice.buyer_address : null,
                grossSales: 0,
                exemptSales: 0,
                zeroRatedSales: 0,
                taxableSales: 0,
                outputTax: 0,
                grossTaxableSales: 0,
            } satisfies SummaryListOfSalesRow)
        current.exemptSales = roundMoney(current.exemptSales + amounts.vatExemptSales + amounts.nonVatSales)
        current.zeroRatedSales = roundMoney(current.zeroRatedSales + amounts.zeroRatedSales)
        current.taxableSales = roundMoney(current.taxableSales + amounts.vatableSales)
        current.outputTax = roundMoney(current.outputTax + amounts.vatAmount)
        current.grossTaxableSales = roundMoney(current.taxableSales + current.outputTax)
        current.grossSales = roundMoney(current.exemptSales + current.zeroRatedSales + current.taxableSales)
        groups.set(key, current)
    }

    const rows = [...groups.values()].sort((a, b) =>
        a.buyerTin === null ? 1 : b.buyerTin === null ? -1 : a.buyerName.localeCompare(b.buyerName),
    )
    const total = (pick: (row: SummaryListOfSalesRow) => number) => sumMoney(rows.map(pick))
    return {
        header,
        year: period.year,
        quarter: period.quarter,
        rows,
        totals: {
            grossSales: total((row) => row.grossSales),
            exemptSales: total((row) => row.exemptSales),
            zeroRatedSales: total((row) => row.zeroRatedSales),
            taxableSales: total((row) => row.taxableSales),
            outputTax: total((row) => row.outputTax),
            grossTaxableSales: total((row) => row.grossTaxableSales),
        },
    }
}

export const getDashboardSummary = async (
    supabase: ServerSupabase,
    organizationId: string,
): Promise<DashboardSummary> => {
    const today = todayInManila()
    const month = monthRange(today)
    const previous = monthRange(dayjs(today).subtract(1, 'month').format('YYYY-MM-DD'))

    const [current, before, drafts, transmissions, series, recent] = await Promise.all([
        fetchReportInvoices(supabase, organizationId, month),
        fetchReportInvoices(supabase, organizationId, previous),
        supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('status', 'draft'),
        supabase
            .from('eis_transmissions')
            .select('status, due_at')
            .eq('organization_id', organizationId)
            .in('status', ['queued', 'failed', 'rejected'])
            .returns<{ status: string; due_at: string }[]>(),
        listSeries(supabase, organizationId),
        listInvoices(supabase, organizationId, { from: 0, to: 7 }),
    ])
    if (drafts.error) throw drafts.error
    if (transmissions.error) throw transmissions.error

    const currentAmounts = current.map(signedAmounts)
    const now = new Date().toISOString()

    return {
        month: {
            totalSales: sumMoney(currentAmounts.map((row) => row.totalAmount)),
            vatAmount: sumMoney(currentAmounts.map((row) => row.vatAmount)),
            issuedCount: current.filter((row) => row.status === 'issued').length,
            voidedCount: current.filter((row) => row.status === 'voided').length,
        },
        previousMonth: { totalSales: sumMoney(before.map(signedAmounts).map((row) => row.totalAmount)) },
        draftCount: drafts.count ?? 0,
        transmissions: {
            pending: transmissions.data.filter((row) => row.status !== 'rejected').length,
            overdue: transmissions.data.filter((row) => row.status !== 'rejected' && row.due_at < now).length,
            rejected: transmissions.data.filter((row) => row.status === 'rejected').length,
        },
        seriesWarnings: series
            .filter((item) => item.isActive && isSeriesRunningLow(item))
            .map((item) => ({
                seriesId: item.id,
                label: `${DOCUMENT_TYPE_LABELS[item.documentType]} — ${item.branchCode} ${item.branchName}`,
                remaining: getRemainingSerials(item),
            })),
        recentInvoices: recent.records,
    }
}
