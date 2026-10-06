'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import VoidInvoiceDialog from '@/components/invoices/dialogs/VoidInvoiceDialog'
import { apiDeleteInvoiceDraft, apiIssueInvoice } from '@/services/invoices'
import useAuthority from '@/utils/hooks/useAuthority'
import { formatPeso } from '@/utils/money'
import { ACTION_INVOICE_ISSUE, ACTION_INVOICE_VOID, ACTION_MEMO_ISSUE } from '@/constants/actions.constant'
import { DOCUMENT_TYPE_LABELS, isMemoDocumentType } from '@/constants/bir.constant'
import { getEditInvoicePath, getNewMemoPath, getPrintInvoicePath, invoicesPath } from '@/configs/app.config'
import {
    CreditMemoIcon,
    DebitMemoIcon,
    DeleteIcon,
    EditIcon,
    EmailIcon,
    IssueIcon,
    MoreIcon,
    PrintIcon,
    VoidIcon,
} from '@/configs/icons.config'
import type { InvoiceDetails } from '@/@types/invoices/InvoiceDetails'

interface InvoiceActionsProps {
    invoice: InvoiceDetails
    hasActiveSeries: boolean
    onChanged: (invoice?: InvoiceDetails) => void
}

/** Buttons for what can be done with the document in its current state and the user's role. */
export default function InvoiceActions({ invoice, hasActiveSeries, onChanged }: InvoiceActionsProps) {
    const router = useRouter()
    const canIssue = useAuthority(ACTION_INVOICE_ISSUE)
    const canVoid = useAuthority(ACTION_INVOICE_VOID)
    const canIssueMemo = useAuthority(ACTION_MEMO_ISSUE)

    const [dialog, setDialog] = useState<'issue' | 'delete' | 'void' | null>(null)
    const [busy, setBusy] = useState(false)

    const isDraft = invoice.status === 'draft'
    const isIssued = invoice.status === 'issued'
    const isMemo = isMemoDocumentType(invoice.documentType)
    const label = DOCUMENT_TYPE_LABELS[invoice.documentType]

    const issue = async () => {
        setBusy(true)
        try {
            const issued = await apiIssueInvoice(invoice.id)
            toastSuccess(`${label} ${issued.invoiceNumber} issued.`)
            setDialog(null)
            onChanged(issued)
        } catch (error) {
            toastError('Could not issue the document.', error)
        } finally {
            setBusy(false)
        }
    }

    const remove = async () => {
        setBusy(true)
        try {
            await apiDeleteInvoiceDraft(invoice.id)
            toastSuccess('Draft deleted.')
            router.push(invoicesPath)
        } catch (error) {
            toastError('Could not delete the draft.', error)
            setBusy(false)
        }
    }

    const emailHref = invoice.buyer.email
        ? `mailto:${invoice.buyer.email}?subject=${encodeURIComponent(`${label} ${invoice.invoiceNumber ?? ''}`)}&body=${encodeURIComponent(
              `Please find attached ${label} ${invoice.invoiceNumber ?? ''} dated ${invoice.invoiceDate} for ${formatPeso(invoice.totalAmount)}.`,
          )}`
        : undefined

    return (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
            {isDraft && canIssue && (
                <>
                    <Button size="sm" icon={<EditIcon />} onClick={() => router.push(getEditInvoicePath(invoice.id))}>
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<IssueIcon />}
                        disabled={!hasActiveSeries || (isMemo && !canIssueMemo)}
                        onClick={() => setDialog('issue')}
                    >
                        Issue
                    </Button>
                </>
            )}
            <Button
                size="sm"
                icon={<PrintIcon />}
                onClick={() => window.open(getPrintInvoicePath(invoice.id), '_blank', 'noopener')}
            >
                {isDraft ? 'Preview' : 'Print / PDF'}
            </Button>
            {(isDraft || (isIssued && ((!isMemo && canIssueMemo) || canVoid)) || emailHref) && (
                <Dropdown
                    placement="bottom-end"
                    renderTitle={<Button size="sm" icon={<MoreIcon />} aria-label="More actions" />}
                >
                    {!isDraft && emailHref && (
                        <Dropdown.Item eventKey="email" onClick={() => window.open(emailHref)}>
                            <span className="flex items-center gap-2">
                                <EmailIcon /> Email to buyer
                            </span>
                        </Dropdown.Item>
                    )}
                    {isIssued && !isMemo && canIssueMemo && (
                        <>
                            <Dropdown.Item
                                eventKey="credit"
                                onClick={() => router.push(getNewMemoPath(invoice.id, 'credit_memo'))}
                            >
                                <span className="flex items-center gap-2">
                                    <CreditMemoIcon /> Issue credit memo
                                </span>
                            </Dropdown.Item>
                            <Dropdown.Item
                                eventKey="debit"
                                onClick={() => router.push(getNewMemoPath(invoice.id, 'debit_memo'))}
                            >
                                <span className="flex items-center gap-2">
                                    <DebitMemoIcon /> Issue debit memo
                                </span>
                            </Dropdown.Item>
                        </>
                    )}
                    {isIssued && canVoid && (
                        <Dropdown.Item eventKey="void" onClick={() => setDialog('void')}>
                            <span className="flex items-center gap-2 text-error">
                                <VoidIcon /> Void
                            </span>
                        </Dropdown.Item>
                    )}
                    {isDraft && canIssue && (
                        <Dropdown.Item eventKey="delete" onClick={() => setDialog('delete')}>
                            <span className="flex items-center gap-2 text-error">
                                <DeleteIcon /> Delete draft
                            </span>
                        </Dropdown.Item>
                    )}
                </Dropdown>
            )}

            <ConfirmDialog
                isOpen={dialog === 'issue'}
                type="warning"
                title={`Issue this ${label.toLowerCase()}?`}
                confirmText="Issue now"
                onClose={() => setDialog(null)}
                onConfirm={issue}
                closable={!busy}
                confirmButtonProps={{ loading: busy }}
            >
                It will receive the next serial number for its branch and can no longer be edited or deleted. Total:{' '}
                <strong>{formatPeso(invoice.totalAmount)}</strong>.
            </ConfirmDialog>
            <ConfirmDialog
                isOpen={dialog === 'delete'}
                type="danger"
                title="Delete this draft?"
                confirmText="Delete"
                onClose={() => setDialog(null)}
                onConfirm={remove}
                closable={!busy}
                confirmButtonProps={{ loading: busy }}
            >
                Drafts have no serial number yet, so deleting one leaves no gap in your series.
            </ConfirmDialog>
            {isIssued && (
                <VoidInvoiceDialog
                    invoice={invoice}
                    isOpen={dialog === 'void'}
                    onClose={() => setDialog(null)}
                    onVoided={(voided) => {
                        setDialog(null)
                        onChanged(voided)
                    }}
                />
            )}
        </div>
    )
}
