'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import CustomerForm from '@/components/customers/forms/CustomerForm'
import { apiCreateCustomer, apiUpdateCustomer } from '@/services/customers'
import type { Customer } from '@/@types/customers/Customer'
import type { CustomerFormData } from '@/@types/customers/forms/CustomerFormData'

interface CustomerDialogProps {
    isOpen: boolean
    customer?: Customer | null
    onClose: () => void
    onSaved: (customer: Customer) => void
}

const FORM_ID = 'customer-form'

/** Add or edit a customer. */
export default function CustomerDialog({ isOpen, customer, onClose, onSaved }: CustomerDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: CustomerFormData) => {
        setSaving(true)
        try {
            const saved = customer ? await apiUpdateCustomer(customer.id, data) : await apiCreateCustomer(data)
            toastSuccess(customer ? 'Customer updated.' : 'Customer added.')
            onSaved(saved)
        } catch (error) {
            toastError('Could not save the customer.', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} width={640} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">{customer ? 'Edit customer' : 'Add customer'}</h4>
            <p className="mb-5 text-gray-500">
                Changes apply to new invoices only — issued invoices keep the buyer details they were issued with.
            </p>
            {isOpen && (
                <CustomerForm key={customer?.id ?? 'new'} id={FORM_ID} customer={customer} onSubmit={onSubmit} />
            )}
            <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    {customer ? 'Save changes' : 'Add customer'}
                </Button>
            </div>
        </Dialog>
    )
}
