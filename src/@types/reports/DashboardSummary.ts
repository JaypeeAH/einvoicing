import type { Invoice } from '@/@types/invoices/Invoice'

export interface DashboardSummary {
    month: { totalSales: number; vatAmount: number; issuedCount: number; voidedCount: number }
    previousMonth: { totalSales: number }
    draftCount: number
    transmissions: { pending: number; overdue: number; rejected: number }
    seriesWarnings: { seriesId: string; label: string; remaining: number }[]
    recentInvoices: Invoice[]
}
