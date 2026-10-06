'use client'

import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Segment from '@/components/ui/Segment'
import { BranchFormSchema, type BranchFormData } from '@/@types/branches/forms/BranchFormData'
import type { Branch } from '@/@types/branches/Branch'

export const getBranchFormDefaults = (branch?: Branch | null): BranchFormData => ({
    code: branch?.code ?? '',
    name: branch?.name ?? '',
    address: branch?.address ?? '',
    rdoCode: branch?.rdoCode ?? '',
    status: branch?.status ?? 'active',
})

interface BranchFormProps {
    id: string
    branch?: Branch | null
    onSubmit: (data: BranchFormData) => Promise<void>
}

/** A place of business as shown on its BIR Certificate of Registration. The head office code is fixed. */
export default function BranchForm({ id, branch, onSubmit }: BranchFormProps) {
    const form = useForm<BranchFormData>({
        resolver: zodResolver(BranchFormSchema),
        defaultValues: getBranchFormDefaults(branch),
    })
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form
    const isHeadOffice = !!branch?.isHeadOffice
    const status = useWatch({ control, name: 'status' })

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FormItem label="Branch code" asterisk invalid={!!errors.code} errorMessage={errors.code?.message}>
                        <Controller
                            name="code"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="00001"
                                    inputMode="numeric"
                                    maxLength={5}
                                    disabled={isHeadOffice}
                                />
                            )}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {isHeadOffice
                                ? 'The head office is always 00000.'
                                : 'The 5 digits after your TIN on the branch’s COR.'}
                        </p>
                    </FormItem>
                    <FormItem
                        label="RDO code"
                        asterisk
                        invalid={!!errors.rdoCode}
                        errorMessage={errors.rdoCode?.message}
                    >
                        <Controller
                            name="rdoCode"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="e.g. 047" />}
                        />
                    </FormItem>
                    <FormItem
                        label="Branch name"
                        asterisk
                        invalid={!!errors.name}
                        errorMessage={errors.name?.message}
                        className="sm:col-span-2"
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="e.g. Cebu branch" />}
                        />
                    </FormItem>
                    <FormItem
                        label="Registered address"
                        asterisk
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
                                    textArea
                                    rows={2}
                                    placeholder="Address as shown on the branch’s COR"
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Status" className="mb-0 sm:col-span-2">
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Segment
                                    size="sm"
                                    value={field.value}
                                    onChange={(value) => typeof value === 'string' && value && field.onChange(value)}
                                >
                                    <Segment.Item value="active">Open</Segment.Item>
                                    <Segment.Item value="closed" disabled={isHeadOffice}>
                                        Closed
                                    </Segment.Item>
                                </Segment>
                            )}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {status === 'closed'
                                ? 'A closed branch can no longer issue invoices. Its past invoices are kept.'
                                : 'This branch can issue invoices once it has an active invoice series.'}
                        </p>
                    </FormItem>
                </div>
            </Form>
        </FormProvider>
    )
}
