import classNames from '@/utils/classNames'
import { formatPeso, formatRate } from '@/utils/money'
import type { InvoiceTotals } from '@/@types/invoices/InvoiceTotals'

interface InvoiceTotalsPreviewProps {
    totals: InvoiceTotals
    isVatSeller: boolean
    withholdingTaxRate: number
    className?: string
}

const Line = ({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) => (
    <div
        className={classNames(
            'flex items-center justify-between gap-4 py-1',
            strong &&
                'border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-gray-100',
            muted && 'text-gray-400',
        )}
    >
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
    </div>
)

/** Live totals while editing. The server recalculates everything when the draft is saved. */
export default function InvoiceTotalsPreview({
    totals,
    isVatSeller,
    withholdingTaxRate,
    className,
}: InvoiceTotalsPreviewProps) {
    return (
        <div className={classNames('text-sm', className)}>
            {isVatSeller ? (
                <>
                    <Line label="VATable sales" value={formatPeso(totals.vatableSales)} muted={!totals.vatableSales} />
                    <Line
                        label="VAT-exempt sales"
                        value={formatPeso(totals.vatExemptSales)}
                        muted={!totals.vatExemptSales}
                    />
                    <Line
                        label="Zero-rated sales"
                        value={formatPeso(totals.zeroRatedSales)}
                        muted={!totals.zeroRatedSales}
                    />
                    <Line label="VAT (12%)" value={formatPeso(totals.vatAmount)} muted={!totals.vatAmount} />
                </>
            ) : (
                <>
                    <Line label="Sales subject to percentage tax" value={formatPeso(totals.nonVatSales)} />
                    <Line
                        label="Exempt sales"
                        value={formatPeso(totals.vatExemptSales)}
                        muted={!totals.vatExemptSales}
                    />
                </>
            )}
            {totals.discountAmount > 0 && <Line label="Discounts" value={`− ${formatPeso(totals.discountAmount)}`} />}
            {totals.specialDiscountAmount > 0 && (
                <Line label="Special discounts" value={`− ${formatPeso(totals.specialDiscountAmount)}`} />
            )}
            <Line label="Total amount" value={formatPeso(totals.totalAmount)} strong />
            {withholdingTaxRate > 0 && (
                <>
                    <Line
                        label={`Less withholding tax (${formatRate(withholdingTaxRate)})`}
                        value={`− ${formatPeso(totals.withholdingTaxAmount)}`}
                    />
                    <Line label="Amount due" value={formatPeso(totals.amountDue)} strong />
                </>
            )}
        </div>
    )
}
