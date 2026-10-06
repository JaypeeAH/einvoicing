'use client'

import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import ProductSelect from '@/components/products/ProductSelect'
import useTaxTreatmentOptions from '@/utils/hooks/useTaxTreatmentOptions'
import { emptyInvoiceLine } from '@/utils/invoices/invoiceFormData'
import { formatAmount } from '@/utils/money'
import { AddIcon, DeleteIcon } from '@/configs/icons.config'
import type { CalculatedLine } from '@/utils/invoices/calculateInvoice'
import type { InvoiceFormData } from '@/@types/invoices/forms/InvoiceFormData'
import type { Product } from '@/@types/products/Product'
import type { TaxTreatment } from '@/constants/bir.constant'
import type { Option } from '@/@types/common'

interface InvoiceLinesEditorProps {
    /** Live amounts for each line (same order as the field array). */
    calculated: CalculatedLine[]
    showSpecialDiscount: boolean
    specialDiscountLabel?: string
}

const fieldLabel = 'mb-1 block text-xs font-semibold text-gray-500 md:hidden'

/** Editable invoice lines: pick from the catalog or type freely; amounts update as you type. */
export default function InvoiceLinesEditor({
    calculated,
    showSpecialDiscount,
    specialDiscountLabel,
}: InvoiceLinesEditorProps) {
    const {
        control,
        formState: { errors },
    } = useFormContext<InvoiceFormData>()
    const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
    const treatmentOptions = useTaxTreatmentOptions()
    const defaultTreatment = treatmentOptions[0].value

    const addProduct = (product: Product) =>
        append({
            productId: product.id,
            description: product.name,
            unit: product.unit,
            quantity: 1,
            unitPrice: product.unitPrice,
            discountAmount: 0,
            taxTreatment: treatmentOptions.some((option) => option.value === product.taxTreatment)
                ? product.taxTreatment
                : defaultTreatment,
            specialDiscount: false,
        })

    return (
        <div>
            <div className="hidden grid-cols-12 gap-2 border-b border-gray-200 pb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase md:grid dark:border-gray-700">
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-2 text-right">Unit price</div>
                <div className="col-span-1 text-right">Discount</div>
                <div className="col-span-2">Tax</div>
                <div className="col-span-1 text-right">Amount</div>
            </div>

            {fields.map((field, index) => {
                const lineErrors = errors.lines?.[index]
                return (
                    <div
                        key={field.id}
                        className="grid grid-cols-2 gap-2 border-b border-gray-100 py-3 md:grid-cols-12 md:items-start dark:border-gray-700"
                    >
                        <div className="col-span-2 md:col-span-4">
                            <label className={fieldLabel}>Description</label>
                            <Controller
                                name={`lines.${index}.description`}
                                control={control}
                                render={({ field: input }) => (
                                    <Input
                                        {...input}
                                        size="sm"
                                        invalid={!!lineErrors?.description}
                                        placeholder="Goods or nature of service"
                                    />
                                )}
                            />
                            {lineErrors?.description && (
                                <p className="mt-1 text-xs text-error">{lineErrors.description.message}</p>
                            )}
                            {showSpecialDiscount && (
                                <Controller
                                    name={`lines.${index}.specialDiscount`}
                                    control={control}
                                    render={({ field: input }) => (
                                        <Checkbox
                                            className="mt-2 text-xs font-normal"
                                            checked={!!input.value}
                                            onChange={(checked) => input.onChange(checked)}
                                        >
                                            Apply {specialDiscountLabel ?? 'special'} discount (VAT-exempt)
                                        </Checkbox>
                                    )}
                                />
                            )}
                        </div>
                        <div className="md:col-span-1">
                            <label className={fieldLabel}>Qty</label>
                            <Controller
                                name={`lines.${index}.quantity`}
                                control={control}
                                render={({ field: input }) => (
                                    <Input
                                        {...input}
                                        value={input.value as number | string}
                                        size="sm"
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="any"
                                        className="text-right"
                                        invalid={!!lineErrors?.quantity}
                                    />
                                )}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className={fieldLabel}>Unit</label>
                            <Controller
                                name={`lines.${index}.unit`}
                                control={control}
                                render={({ field: input }) => (
                                    <Input {...input} size="sm" invalid={!!lineErrors?.unit} />
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={fieldLabel}>Unit price</label>
                            <Controller
                                name={`lines.${index}.unitPrice`}
                                control={control}
                                render={({ field: input }) => (
                                    <Input
                                        {...input}
                                        value={input.value as number | string}
                                        size="sm"
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="0.01"
                                        className="text-right"
                                        invalid={!!lineErrors?.unitPrice}
                                    />
                                )}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className={fieldLabel}>Discount</label>
                            <Controller
                                name={`lines.${index}.discountAmount`}
                                control={control}
                                render={({ field: input }) => (
                                    <Input
                                        {...input}
                                        value={(input.value ?? 0) as number | string}
                                        size="sm"
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="0.01"
                                        className="text-right"
                                    />
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={fieldLabel}>Tax</label>
                            <Controller
                                name={`lines.${index}.taxTreatment`}
                                control={control}
                                render={({ field: input }) => (
                                    <Select<Option<TaxTreatment>>
                                        size="sm"
                                        options={treatmentOptions}
                                        value={treatmentOptions.find((option) => option.value === input.value)}
                                        onChange={(option) => input.onChange(option?.value)}
                                        isSearchable={false}
                                        menuPortalTarget={typeof document === 'undefined' ? undefined : document.body}
                                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 60 }) }}
                                    />
                                )}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2 md:col-span-1 md:block md:pt-2 md:text-right">
                            <span className="font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                                {formatAmount(calculated[index]?.totalAmount ?? 0)}
                            </span>
                            <Button
                                size="xs"
                                variant="plain"
                                icon={<DeleteIcon />}
                                aria-label="Remove line"
                                className="hover:text-error md:mt-1 md:ml-auto"
                                disabled={fields.length === 1}
                                onClick={() => remove(index)}
                            />
                        </div>
                    </div>
                )
            })}

            {errors.lines?.root?.message && <p className="mt-2 text-sm text-error">{errors.lines.root.message}</p>}
            {errors.lines?.message && <p className="mt-2 text-sm text-error">{errors.lines.message}</p>}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="sm:w-80">
                    <ProductSelect onSelect={addProduct} placeholder="Add from products & services…" />
                </div>
                <Button size="sm" icon={<AddIcon />} onClick={() => append(emptyInvoiceLine(defaultTreatment))}>
                    Add blank line
                </Button>
            </div>
        </div>
    )
}
