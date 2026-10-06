'use client'

import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Segment from '@/components/ui/Segment'
import useTaxTreatmentOptions from '@/utils/hooks/useTaxTreatmentOptions'
import { ProductFormSchema, type ProductFormData } from '@/@types/products/forms/ProductFormData'
import type { TaxTreatment } from '@/constants/bir.constant'
import type { Product } from '@/@types/products/Product'
import type { Option } from '@/@types/common'

export const getProductFormDefaults = (
    product: Product | null | undefined,
    defaultTreatment: TaxTreatment,
): ProductFormData => ({
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    unit: product?.unit ?? 'pc',
    unitPrice: product?.unitPrice ?? 0,
    taxTreatment: product?.taxTreatment ?? defaultTreatment,
    isService: product?.isService ?? false,
    isActive: product?.isActive ?? true,
})

interface ProductFormProps {
    id: string
    product?: Product | null
    onSubmit: (data: ProductFormData) => Promise<void>
}

/** A good or service with its default price and tax treatment. */
export default function ProductForm({ id, product, onSubmit }: ProductFormProps) {
    const treatmentOptions = useTaxTreatmentOptions()

    const form = useForm<ProductFormData>({
        resolver: zodResolver(ProductFormSchema),
        defaultValues: getProductFormDefaults(product, treatmentOptions[0].value),
    })
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FormItem label="Type" className="sm:col-span-2">
                        <Controller
                            name="isService"
                            control={control}
                            render={({ field }) => (
                                <Segment
                                    size="sm"
                                    value={field.value ? 'service' : 'goods'}
                                    onChange={(value) => field.onChange(value === 'service')}
                                >
                                    <Segment.Item value="goods">Goods</Segment.Item>
                                    <Segment.Item value="service">Service</Segment.Item>
                                </Segment>
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Name"
                        asterisk
                        invalid={!!errors.name}
                        errorMessage={errors.name?.message}
                        className="sm:col-span-2"
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} placeholder="As it should appear on the invoice" />
                            )}
                        />
                    </FormItem>
                    <FormItem label="SKU / code" invalid={!!errors.sku} errorMessage={errors.sku?.message}>
                        <Controller
                            name="sku"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} value={field.value ?? ''} placeholder="Optional" />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Unit" asterisk invalid={!!errors.unit} errorMessage={errors.unit?.message}>
                        <Controller
                            name="unit"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="pc, hr, kg, box…" />}
                        />
                    </FormItem>
                    <FormItem
                        label="Default unit price (₱)"
                        asterisk
                        invalid={!!errors.unitPrice}
                        errorMessage={errors.unitPrice?.message}
                    >
                        <Controller
                            name="unitPrice"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value as number | string}
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step="0.01"
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Tax treatment"
                        invalid={!!errors.taxTreatment}
                        errorMessage={errors.taxTreatment?.message}
                    >
                        <Controller
                            name="taxTreatment"
                            control={control}
                            render={({ field }) => (
                                <Select<Option<TaxTreatment>>
                                    options={treatmentOptions}
                                    value={treatmentOptions.find((option) => option.value === field.value)}
                                    onChange={(option) => field.onChange(option?.value)}
                                    isSearchable={false}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Description"
                        invalid={!!errors.description}
                        errorMessage={errors.description?.message}
                        className="sm:col-span-2"
                    >
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    textArea
                                    rows={2}
                                    placeholder="Optional details"
                                />
                            )}
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
