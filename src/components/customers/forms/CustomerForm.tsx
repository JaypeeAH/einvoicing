'use client'

import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import { CustomerFormSchema, type CustomerFormData } from '@/@types/customers/forms/CustomerFormData'
import { CUSTOMER_TYPES, CUSTOMER_TYPE_LABELS, type CustomerType } from '@/constants/bir.constant'
import type { Customer } from '@/@types/customers/Customer'
import type { Option } from '@/@types/common'

const CUSTOMER_TYPE_OPTIONS: Option<CustomerType>[] = CUSTOMER_TYPES.map((value) => ({
    value,
    label: CUSTOMER_TYPE_LABELS[value],
}))

export const getCustomerFormDefaults = (customer?: Customer | null): CustomerFormData => ({
    customerType: customer?.customerType ?? 'business',
    registeredName: customer?.registeredName ?? '',
    businessName: customer?.businessName ?? '',
    tin: customer?.tin ?? '',
    branchCode: customer?.branchCode ?? '',
    address: customer?.address ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    isVatRegistered: customer?.isVatRegistered ?? false,
    isActive: customer?.isActive ?? true,
})

interface CustomerFormProps {
    id: string
    customer?: Customer | null
    onSubmit: (data: CustomerFormData) => Promise<void>
}

/** Buyer details as registered with BIR. TIN and address are required for VAT-registered buyers. */
export default function CustomerForm({ id, customer, onSubmit }: CustomerFormProps) {
    const form = useForm<CustomerFormData>({
        resolver: zodResolver(CustomerFormSchema),
        defaultValues: getCustomerFormDefaults(customer),
    })
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form
    const isVatRegistered = useWatch({ control, name: 'isVatRegistered' })

    return (
        <FormProvider {...form}>
            <Form
                id={id}
                noValidate
                onSubmit={(e) => {
                    // The dialog may be portalled out of another form (e.g. the invoice editor); React would
                    // otherwise bubble this submit event up to that form too.
                    e.stopPropagation()
                    return handleSubmit(onSubmit)(e)
                }}
            >
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FormItem
                        label="Customer type"
                        invalid={!!errors.customerType}
                        errorMessage={errors.customerType?.message}
                    >
                        <Controller
                            name="customerType"
                            control={control}
                            render={({ field }) => (
                                <Select<Option<CustomerType>>
                                    options={CUSTOMER_TYPE_OPTIONS}
                                    value={CUSTOMER_TYPE_OPTIONS.find((option) => option.value === field.value)}
                                    onChange={(option) => field.onChange(option?.value)}
                                    isSearchable={false}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="VAT-registered buyer" extra=" ">
                        <Controller
                            name="isVatRegistered"
                            control={control}
                            render={({ field }) => (
                                <div className="flex h-10 items-center gap-3">
                                    <Switcher checked={field.value} onChange={(checked) => field.onChange(checked)} />
                                    <span className="text-gray-500">
                                        {field.value ? 'Claims input VAT — TIN required' : 'Not VAT-registered'}
                                    </span>
                                </div>
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Registered name"
                        asterisk
                        invalid={!!errors.registeredName}
                        errorMessage={errors.registeredName?.message}
                        className="sm:col-span-2"
                    >
                        <Controller
                            name="registeredName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Name as registered with BIR (or the person’s full name)"
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Business name / style"
                        invalid={!!errors.businessName}
                        errorMessage={errors.businessName?.message}
                        className="sm:col-span-2"
                    >
                        <Controller
                            name="businessName"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} value={field.value ?? ''} placeholder="Optional" />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="TIN"
                        asterisk={isVatRegistered}
                        invalid={!!errors.tin}
                        errorMessage={errors.tin?.message}
                    >
                        <Controller
                            name="tin"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} value={field.value ?? ''} placeholder="123-456-789" />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Branch code"
                        invalid={!!errors.branchCode}
                        errorMessage={errors.branchCode?.message}
                    >
                        <Controller
                            name="branchCode"
                            control={control}
                            render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="00000" />}
                        />
                    </FormItem>
                    <FormItem
                        label="Address"
                        asterisk={isVatRegistered}
                        invalid={!!errors.address}
                        errorMessage={errors.address?.message}
                        className="sm:col-span-2"
                    >
                        <Controller
                            name="address"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    textArea
                                    rows={2}
                                    placeholder="Registered address"
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Email" invalid={!!errors.email} errorMessage={errors.email?.message}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    type="email"
                                    placeholder="For e-invoice delivery"
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Phone" invalid={!!errors.phone} errorMessage={errors.phone?.message}>
                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => <Input {...field} value={field.value ?? ''} />}
                        />
                    </FormItem>
                    <FormItem label="Active" className="mb-0">
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <Switcher checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            )}
                        />
                    </FormItem>
                </div>
            </Form>
        </FormProvider>
    )
}
