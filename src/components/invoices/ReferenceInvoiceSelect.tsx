'use client'

import { useMemo, useState } from 'react'
import Select from '@/components/ui/Select'
import { useSWRInvoices } from '@/services/invoices'
import useDebounce from '@/utils/hooks/useDebounce'
import { formatDateOnly } from '@/utils/date'
import { formatPeso } from '@/utils/money'
import { DOCUMENT_TYPE_LABELS } from '@/constants/bir.constant'
import type { Invoice } from '@/@types/invoices/Invoice'

export interface ReferenceInvoice {
    id: string
    invoiceNumber: string | null
    invoiceDate: string
    documentType: Invoice['documentType']
    totalAmount: number
    buyerName?: string
}

interface ReferenceOption {
    value: string
    label: string
    invoice: ReferenceInvoice
}

interface ReferenceInvoiceSelectProps {
    id?: string
    value: ReferenceInvoice | null
    onChange: (invoice: ReferenceInvoice | null) => void
    invalid?: boolean
    isDisabled?: boolean
}

const toOption = (invoice: ReferenceInvoice): ReferenceOption => ({
    value: invoice.id,
    label: `${DOCUMENT_TYPE_LABELS[invoice.documentType]} ${invoice.invoiceNumber ?? ''}`,
    invoice,
})

/** Picks the issued invoice a credit or debit memo adjusts (search by number, customer or TIN). */
export default function ReferenceInvoiceSelect({
    id,
    value,
    onChange,
    invalid,
    isDisabled,
}: ReferenceInvoiceSelectProps) {
    const [input, setInput] = useState('')
    const query = useDebounce(input.trim(), 300)
    const { data, isLoading } = useSWRInvoices({ query, size: 20, status: 'issued' })

    const options = useMemo(
        () =>
            (data?.records ?? [])
                .filter(
                    (invoice) => invoice.documentType === 'sales_invoice' || invoice.documentType === 'service_invoice',
                )
                .map((invoice) => toOption(invoice)),
        [data],
    )

    return (
        <Select<ReferenceOption>
            inputId={id}
            options={options}
            value={value ? toOption(value) : null}
            onChange={(option) => onChange(option?.invoice ?? null)}
            onInputChange={(text, meta) => {
                if (meta.action === 'input-change') setInput(text)
            }}
            filterOption={null}
            invalid={invalid}
            isDisabled={isDisabled}
            isLoading={isLoading}
            isClearable
            placeholder="Search invoice number or customer…"
            noOptionsMessage={() => 'No issued invoices found'}
            formatOptionLabel={(option, meta) =>
                meta.context === 'menu' ? (
                    <div>
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-xs text-gray-500">
                            {formatDateOnly(option.invoice.invoiceDate)} · {option.invoice.buyerName} ·{' '}
                            {formatPeso(option.invoice.totalAmount)}
                        </div>
                    </div>
                ) : (
                    option.label
                )
            }
        />
    )
}
