'use client'

import { useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import { apiVoidInvoice } from '@/services/invoices'
import { VoidInvoiceFormSchema, type VoidInvoiceFormData } from '@/@types/invoices/forms/InvoiceFormData'
import type { InvoiceDetails } from '@/@types/invoices/InvoiceDetails'

interface VoidInvoiceDialogProps {
    invoice: InvoiceDetails
    isOpen: boolean
    onClose: () => void
    onVoided: (invoice: InvoiceDetails) => void
}

const FORM_ID = 'void-invoice-form'

/** Voids an issued document with a reason. The number stays used and the document stays on record. */
export default function VoidInvoiceDialog({ invoice, isOpen, onClose, onVoided }: VoidInvoiceDialogProps) {
    const [saving, setSaving] = useState(false)
    const form = useForm<VoidInvoiceFormData>({
        resolver: zodResolver(VoidInvoiceFormSchema),
        defaultValues: { reason: '' },
    })
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form

    const onSubmit = async ({ reason }: VoidInvoiceFormData) => {
        setSaving(true)
        try {
            const voided = await apiVoidInvoice(invoice.id, reason)
            toastSuccess(`${voided.invoiceNumber} has been voided.`)
            onVoided(voided)
        } catch (error) {
            toastError('Could not void the document.', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <ConfirmDialog
            isOpen={isOpen}
            type="danger"
            title={`Void ${invoice.invoiceNumber}?`}
            confirmText="Void document"
            confirmForm={FORM_ID}
            onClose={onClose}
            closable={!saving}
            confirmButtonProps={{ loading: saving }}
        >
            <p className="mb-4">
                Voiding keeps the document and its number on record, marked VOID, and removes it from your sales. Use a
                credit memo instead if the buyer already recorded this invoice or it was sent to BIR.
            </p>
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FormItem
                        label="Reason"
                        asterisk
                        invalid={!!errors.reason}
                        errorMessage={errors.reason?.message}
                        className="mb-2"
                    >
                        <Controller
                            name="reason"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    textArea
                                    rows={3}
                                    placeholder="e.g. Wrong customer selected; re-issued as SI-000124"
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
