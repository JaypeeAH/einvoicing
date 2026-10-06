'use client'

import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import CustomerSelect from '@/components/customers/CustomerSelect'
import CustomerDialog from '@/components/customers/dialogs/CustomerDialog'
import useAuthority from '@/utils/hooks/useAuthority'
import { ACTION_CUSTOMER_MANAGE } from '@/constants/actions.constant'
import { BUYER_DETAILS_THRESHOLD } from '@/constants/bir.constant'
import { AddIcon } from '@/configs/icons.config'
import type { Customer } from '@/@types/customers/Customer'
import type { CustomerMeta } from '@/@types/customers/CustomerMeta'
import type { InvoiceFormData } from '@/@types/invoices/forms/InvoiceFormData'

interface InvoiceBuyerFieldsProps {
    customer: CustomerMeta | null
    onCustomerChange: (customer: CustomerMeta | null) => void
    /** Memos keep the buyer of the invoice they adjust. */
    locked?: boolean
}

/** Buyer section: pick a saved customer (fills the details) or type a one-time buyer. */
export default function InvoiceBuyerFields({ customer, onCustomerChange, locked }: InvoiceBuyerFieldsProps) {
    const {
        control,
        setValue,
        formState: { errors },
    } = useFormContext<InvoiceFormData>()
    const canAddCustomer = useAuthority(ACTION_CUSTOMER_MANAGE)
    const [adding, setAdding] = useState(false)

    const selectCustomer = (selected: Customer | null) => {
        onCustomerChange(selected)
        setValue('customerId', selected?.id ?? null, { shouldDirty: true })
        if (selected) {
            setValue('buyer.name', selected.registeredName, { shouldDirty: true })
            setValue('buyer.businessName', selected.businessName ?? '', { shouldDirty: true })
            setValue('buyer.tin', selected.tin ?? '', { shouldDirty: true })
            setValue('buyer.branchCode', selected.branchCode ?? '', { shouldDirty: true })
            setValue('buyer.address', selected.address ?? '', { shouldDirty: true })
            setValue('buyer.email', selected.email ?? '', { shouldDirty: true })
        }
    }

    const field = (name: keyof InvoiceFormData['buyer'], label: string, placeholder?: string, className?: string) => (
        <FormItem
            label={label}
            invalid={!!errors.buyer?.[name]}
            errorMessage={errors.buyer?.[name]?.message}
            className={className}
        >
            <Controller
                name={`buyer.${name}`}
                control={control}
                render={({ field: input }) => (
                    <Input {...input} value={input.value ?? ''} placeholder={placeholder} disabled={locked} />
                )}
            />
        </FormItem>
    )

    return (
        <div>
            {!locked && (
                <FormItem
                    label="Customer"
                    extra={<span className="ml-1 font-normal text-gray-500">(optional for walk-in sales)</span>}
                >
                    <div className="flex gap-2">
                        <div className="min-w-0 flex-auto">
                            <CustomerSelect value={customer} onChange={selectCustomer} />
                        </div>
                        {canAddCustomer && (
                            <Button size="sm" icon={<AddIcon />} onClick={() => setAdding(true)}>
                                New
                            </Button>
                        )}
                    </div>
                </FormItem>
            )}
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                {field('name', 'Buyer registered name', 'Required for business buyers', 'sm:col-span-2')}
                {field('businessName', 'Business name / style', 'Optional')}
                {field('tin', 'Buyer TIN', '123-456-789')}
                {field('branchCode', 'Buyer branch code', '00000')}
                {field('email', 'Email (for e-invoice delivery)', 'Optional')}
                {field('address', 'Buyer address', undefined, 'sm:col-span-2')}
            </div>
            <p className="-mt-2 text-xs text-gray-500">
                BIR requires the buyer’s name, address and TIN for sales of ₱{BUYER_DETAILS_THRESHOLD.toLocaleString()}{' '}
                or more to VAT-registered buyers — without them the buyer cannot claim input VAT.
            </p>

            <CustomerDialog
                isOpen={adding}
                onClose={() => setAdding(false)}
                onSaved={(saved) => {
                    setAdding(false)
                    selectCustomer(saved)
                }}
            />
        </div>
    )
}
