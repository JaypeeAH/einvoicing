'use client'

import StatCard from '@/components/shared/StatCard'
import { useDashboardStore } from '@/stores/DashboardStore'
import { formatPeso } from '@/utils/money'
import classNames from '@/utils/classNames'
import {
    DocumentIcon,
    InvoiceIcon,
    PesoIcon,
    SalesJournalNavIcon,
    TrendDownIcon,
    TrendUpIcon,
} from '@/configs/icons.config'

/** Key figures for the current month: sales, output VAT, documents issued and drafts waiting. */
export default function DashboardStats() {
    const summary = useDashboardStore((state) => state.data)

    const current = summary?.month.totalSales ?? 0
    const previous = summary?.previousMonth.totalSales ?? 0
    const change = previous > 0 ? Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10 : null

    const salesHint = !summary ? undefined : change === null ? (
        'No sales last month to compare'
    ) : (
        <span className={classNames('inline-flex items-center gap-1', change >= 0 ? 'text-success' : 'text-error')}>
            {change >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
            {Math.abs(change)}% vs last month
        </span>
    )

    return (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                label="Sales this month"
                value={summary ? formatPeso(current) : '—'}
                hint={salesHint}
                icon={<PesoIcon />}
                tone="primary"
            />
            <StatCard
                label="Output VAT this month"
                value={summary ? formatPeso(summary.month.vatAmount) : '—'}
                hint="12% VAT on your VATable sales"
                icon={<SalesJournalNavIcon />}
                tone="info"
            />
            <StatCard
                label="Documents issued"
                value={summary ? summary.month.issuedCount : '—'}
                hint={
                    summary && summary.month.voidedCount > 0
                        ? `${summary.month.voidedCount} voided this month`
                        : 'This month'
                }
                icon={<InvoiceIcon />}
                tone="success"
            />
            <StatCard
                label="Drafts waiting"
                value={summary ? summary.draftCount : '—'}
                hint={summary && summary.draftCount > 0 ? 'Review and issue them' : 'Nothing waiting'}
                icon={<DocumentIcon />}
                tone={summary && summary.draftCount > 0 ? 'warning' : 'primary'}
            />
        </div>
    )
}
