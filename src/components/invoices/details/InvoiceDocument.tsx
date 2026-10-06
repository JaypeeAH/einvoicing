import classNames from '@/utils/classNames'
import { formatAmount, formatQuantity, formatRate } from '@/utils/money'
import { formatDateOnly, formatDateTime } from '@/utils/date'
import { formatTinWithBranch } from '@/utils/tin'
import { providerName, softwareName, softwareVersion } from '@/configs/app.config'
import {
    DOCUMENT_TYPE_LABELS,
    NOT_VALID_FOR_INPUT_TAX,
    SPECIAL_DISCOUNTS,
    isMemoDocumentType,
} from '@/constants/bir.constant'
import type { InvoiceDetails, InvoiceSeller } from '@/@types/invoices/InvoiceDetails'

interface InvoiceDocumentProps {
    invoice: InvoiceDetails
    /** Seller details for draft previews (issued documents use their own snapshot). */
    draftSeller?: InvoiceSeller | null
    /** `ORIGINAL` / `REPRINT` marking for printed copies (RMC 5-2021 Annex B). */
    copyLabel?: 'ORIGINAL' | 'REPRINT' | null
    className?: string
}

const Row = ({ label, value, strong }: { label: string; value: number; strong?: boolean }) => (
    <div
        className={classNames(
            'flex justify-between gap-4 py-0.5',
            strong && 'border-t border-gray-300 pt-1.5 font-bold text-gray-900',
        )}
    >
        <span>{label}</span>
        <span className="tabular-nums">{formatAmount(value)}</span>
    </div>
)

/**
 * The face of the invoice, with the information BIR requires: seller registered name, business style,
 * address and VAT/NON-VAT REG TIN with branch code; document title and serial number; date; buyer name,
 * TIN and address; quantity, unit cost and description; VATable / VAT-exempt / zero-rated / VAT breakdown;
 * special discount details; and the CAS Acknowledgment Certificate number, date and approved series.
 */
export default function InvoiceDocument({ invoice, draftSeller, copyLabel, className }: InvoiceDocumentProps) {
    const seller = invoice.seller ?? draftSeller ?? null
    const isVatSeller = (seller?.vatRegistration ?? 'vat') === 'vat'
    const isMemo = isMemoDocumentType(invoice.documentType)
    const isDraft = invoice.status === 'draft'
    const isVoided = invoice.status === 'voided'
    const special = invoice.specialDiscount ? SPECIAL_DISCOUNTS[invoice.specialDiscount.type] : null
    const hasDiscounts = invoice.lines.some((line) => line.discountAmount > 0 || line.specialDiscountAmount > 0)

    return (
        <div
            className={classNames(
                'print-page relative mx-auto w-full max-w-[860px] overflow-hidden bg-white p-6 text-[13px] leading-snug text-gray-800 sm:p-10',
                className,
            )}
        >
            {(isDraft || isVoided) && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-[110px] font-black tracking-widest text-gray-900/[0.06] select-none"
                    style={{ transform: 'rotate(-25deg)' }}
                >
                    {isDraft ? 'DRAFT' : 'VOID'}
                </div>
            )}

            {/* Seller */}
            <header className="flex flex-col gap-4 border-b-2 border-gray-900 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="text-lg font-bold text-gray-900 uppercase">{seller?.registeredName ?? '—'}</div>
                    {seller?.businessName && <div className="font-semibold text-gray-700">{seller.businessName}</div>}
                    <div>{seller?.address}</div>
                    <div className="font-semibold text-gray-900">
                        {isVatSeller ? 'VAT REG TIN' : 'NON-VAT REG TIN'}:{' '}
                        {formatTinWithBranch(seller?.tin, seller?.branchCode)}
                    </div>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                    <div className="text-xl font-black tracking-wide text-gray-900 uppercase">
                        {DOCUMENT_TYPE_LABELS[invoice.documentType]}
                    </div>
                    <div className="mt-1 text-base">
                        No.{' '}
                        <span className="font-mono text-lg font-bold text-gray-900">
                            {invoice.invoiceNumber ?? 'DRAFT'}
                        </span>
                    </div>
                    <div>Date: {formatDateOnly(invoice.invoiceDate)}</div>
                    {invoice.dueDate && <div>Due: {formatDateOnly(invoice.dueDate)}</div>}
                    {invoice.paymentTerms && <div>Terms: {invoice.paymentTerms}</div>}
                    {copyLabel && (
                        <div className="mt-1 inline-block border border-gray-900 px-2 text-xs font-bold">
                            {copyLabel}
                        </div>
                    )}
                </div>
            </header>

            {/* Buyer */}
            <section className="grid grid-cols-1 gap-x-6 gap-y-1 border-b border-gray-300 py-3 sm:grid-cols-[auto_1fr]">
                <span className="text-gray-500">Sold to:</span>
                <span className="font-semibold text-gray-900">{invoice.buyer.name || ' '}</span>
                {invoice.buyer.businessName && (
                    <>
                        <span className="text-gray-500">Business style:</span>
                        <span>{invoice.buyer.businessName}</span>
                    </>
                )}
                <span className="text-gray-500">TIN:</span>
                <span>{formatTinWithBranch(invoice.buyer.tin, invoice.buyer.branchCode) || ' '}</span>
                <span className="text-gray-500">Address:</span>
                <span>{invoice.buyer.address || ' '}</span>
            </section>

            {isMemo && invoice.referenceInvoice && (
                <section className="border-b border-gray-300 py-3">
                    <div>
                        Reference: {DOCUMENT_TYPE_LABELS[invoice.referenceInvoice.documentType]} No.{' '}
                        <span className="font-semibold">{invoice.referenceInvoice.invoiceNumber}</span> dated{' '}
                        {formatDateOnly(invoice.referenceInvoice.invoiceDate)}
                    </div>
                    {invoice.adjustmentReason && <div>Reason: {invoice.adjustmentReason}</div>}
                </section>
            )}

            {/* Lines */}
            <table className="mt-3 w-full border-collapse">
                <thead>
                    <tr className="border-b border-gray-900 text-left text-xs uppercase">
                        <th className="py-2 pr-2 font-semibold">Qty</th>
                        <th className="py-2 pr-2 font-semibold">Unit</th>
                        <th className="py-2 pr-2 font-semibold">Description</th>
                        <th className="py-2 pr-2 text-right font-semibold">Unit price</th>
                        {hasDiscounts && <th className="py-2 pr-2 text-right font-semibold">Discount</th>}
                        <th className="py-2 text-right font-semibold">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.lines.map((line) => (
                        <tr key={line.id} className="border-b border-gray-200 align-top">
                            <td className="py-1.5 pr-2 tabular-nums">{formatQuantity(line.quantity)}</td>
                            <td className="py-1.5 pr-2">{line.unit}</td>
                            <td className="py-1.5 pr-2">
                                {line.description}
                                {line.taxTreatment === 'vat_exempt' && isVatSeller && (
                                    <span className="ml-1 text-xs text-gray-500">(VAT-Exempt Sale)</span>
                                )}
                                {line.taxTreatment === 'zero_rated' && (
                                    <span className="ml-1 text-xs text-gray-500">(Zero-Rated Sale)</span>
                                )}
                            </td>
                            <td className="py-1.5 pr-2 text-right tabular-nums">{formatAmount(line.unitPrice)}</td>
                            {hasDiscounts && (
                                <td className="py-1.5 pr-2 text-right tabular-nums">
                                    {formatAmount(line.discountAmount + line.specialDiscountAmount)}
                                </td>
                            )}
                            <td className="py-1.5 text-right tabular-nums">{formatAmount(line.totalAmount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <section className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-0.5">
                    {isVatSeller ? (
                        <>
                            <Row label="VATable Sales" value={invoice.vatableSales} />
                            <Row label="VAT-Exempt Sales" value={invoice.vatExemptSales} />
                            <Row label="Zero-Rated Sales" value={invoice.zeroRatedSales} />
                            <Row label="VAT Amount (12%)" value={invoice.vatAmount} />
                        </>
                    ) : (
                        <>
                            <Row label="Sales Subject to Percentage Tax" value={invoice.nonVatSales} />
                            <Row label="Exempt Sales" value={invoice.vatExemptSales} />
                        </>
                    )}
                </div>
                <div className="space-y-0.5">
                    <Row
                        label={invoice.pricesIncludeVat ? 'Total Sales (VAT Inclusive)' : 'Total Sales'}
                        value={invoice.grossAmount}
                    />
                    {invoice.discountAmount > 0 && <Row label="Less: Discount" value={invoice.discountAmount} />}
                    {invoice.specialDiscountAmount > 0 && special && (
                        <Row
                            label={`Less: ${special.label} Discount (${formatRate(special.rate)})`}
                            value={invoice.specialDiscountAmount}
                        />
                    )}
                    {invoice.withholdingTaxAmount > 0 ? (
                        <>
                            <Row label="Total Amount" value={invoice.totalAmount} strong />
                            <Row
                                label={`Less: Withholding Tax (${formatRate(invoice.withholdingTaxRate)})`}
                                value={invoice.withholdingTaxAmount}
                            />
                            <Row label="TOTAL AMOUNT DUE" value={invoice.amountDue} strong />
                        </>
                    ) : (
                        <Row label="TOTAL AMOUNT DUE" value={invoice.totalAmount} strong />
                    )}
                </div>
            </section>

            {invoice.specialDiscount && special && (
                <section className="mt-4 grid grid-cols-1 gap-2 border border-gray-300 p-3 sm:grid-cols-2">
                    <div>
                        {special.label} discount — {special.idLabel}{' '}
                        <span className="font-semibold">{invoice.specialDiscount.idNumber}</span>
                    </div>
                    <div>Name: {invoice.specialDiscount.holderName}</div>
                    <div>TIN: {invoice.specialDiscount.holderTin || ' '}</div>
                    <div>Signature: ______________________</div>
                </section>
            )}

            {invoice.manualInvoiceReference && (
                <p className="mt-3">
                    Replaces manual invoice No. {invoice.manualInvoiceReference} issued during system downtime.
                </p>
            )}
            {invoice.notes && <p className="mt-3 whitespace-pre-line">{invoice.notes}</p>}

            {isMemo && <p className="mt-4 text-center text-sm font-bold uppercase">{NOT_VALID_FOR_INPUT_TAX}</p>}

            {isVoided && (
                <p className="mt-4 border border-gray-900 p-2 text-center font-bold uppercase">
                    VOID — {invoice.voidReason}
                </p>
            )}

            {/* System and BIR registration details */}
            <footer className="mt-6 space-y-0.5 border-t border-gray-300 pt-3 text-[11px] text-gray-600">
                <div>
                    Acknowledgment Certificate No.: {seller?.acNumber ?? '—'}
                    {seller?.acDate && <> · Date Issued: {formatDateOnly(seller.acDate)}</>}
                </div>
                <div>Series Range: {seller?.seriesRange ?? '—'}</div>
                {seller?.ptiNumber && <div>Permit to Issue E-Invoice No.: {seller.ptiNumber}</div>}
                <div>
                    {softwareName} v{softwareVersion} · {providerName}
                </div>
                {invoice.issuedAt && (
                    <div>
                        Issued {formatDateTime(invoice.issuedAt)}
                        {invoice.issuedByName && <> by {invoice.issuedByName}</>}
                        {invoice.integrityHash && <> · Ref {invoice.integrityHash.slice(0, 16).toUpperCase()}</>}
                    </div>
                )}
                {isDraft && <div className="font-bold text-gray-900">DRAFT — NOT A VALID INVOICE</div>}
            </footer>
        </div>
    )
}
