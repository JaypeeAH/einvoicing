'use client'

import { Controller, FormProvider, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Alert from '@/components/ui/Alert'
import { DocumentSeriesFormSchema, type DocumentSeriesFormData } from '@/@types/series/forms/DocumentSeriesFormData'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, MIN_SERIAL_DIGITS, type DocumentType } from '@/constants/bir.constant'
import { formatSerialNumber, formatSeriesRange } from '@/utils/invoices/invoiceNumber'
import type { DocumentSeries } from '@/@types/series/DocumentSeries'
import type { Branch } from '@/@types/branches/Branch'
import type { Option } from '@/@types/common'

const DOCUMENT_TYPE_OPTIONS: Option<DocumentType>[] = DOCUMENT_TYPES.map((value) => ({
    value,
    label: DOCUMENT_TYPE_LABELS[value],
}))

export const getSeriesFormDefaults = (
    series: DocumentSeries | null | undefined,
    branches: Branch[],
): DefaultValues<DocumentSeriesFormData> => ({
    branchId: series?.branchId ?? branches.find((branch) => branch.isHeadOffice)?.id ?? branches[0]?.id ?? '',
    documentType: series?.documentType ?? 'sales_invoice',
    prefix: series?.prefix ?? '',
    startNumber: series?.startNumber ?? 1,
    endNumber: series?.endNumber,
    padding: series?.padding ?? MIN_SERIAL_DIGITS,
    acNumber: series?.acNumber ?? '',
    acDate: series?.acDate?.slice(0, 10) ?? '',
    isActive: series?.isActive ?? true,
})

/** True once a number from the series has been issued (only Active can change after that). */
export const isSeriesUsed = (series: DocumentSeries | null | undefined) =>
    !!series && series.nextNumber > series.startNumber

const toPositiveInteger = (value: unknown) => {
    const number = Number(value)
    return Number.isInteger(number) && number > 0 ? number : null
}

interface SeriesFormProps {
    id: string
    series?: DocumentSeries | null
    branches: Branch[]
    /** Every registered series, used to warn about a second active series for the same branch and type. */
    allSeries: DocumentSeries[]
    onSubmit: (data: DocumentSeriesFormData) => Promise<void>
}

/** A serial-number range from the CAS Acknowledgment Certificate, with a live preview of the first and last number. */
export default function SeriesForm({ id, series, branches, allSeries, onSubmit }: SeriesFormProps) {
    const form = useForm<DocumentSeriesFormData>({
        resolver: zodResolver(DocumentSeriesFormSchema),
        defaultValues: getSeriesFormDefaults(series, branches),
    })
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form

    const used = isSeriesUsed(series)
    const [branchId, documentType, prefix, startNumber, endNumber, padding, isActive] = useWatch({
        control,
        name: ['branchId', 'documentType', 'prefix', 'startNumber', 'endNumber', 'padding', 'isActive'],
    })

    const branchOptions: Option[] = branches
        .filter((branch) => branch.status === 'active' || branch.id === series?.branchId)
        .map((branch) => ({ value: branch.id, label: `${branch.code} · ${branch.name}` }))

    const start = toPositiveInteger(startNumber)
    const end = toPositiveInteger(endNumber)
    const digits = Math.max(toPositiveInteger(padding) ?? MIN_SERIAL_DIGITS, MIN_SERIAL_DIGITS)
    const cleanPrefix = (prefix ?? '').trim().toUpperCase()
    const preview =
        start && end && end >= start
            ? {
                  first: formatSerialNumber(cleanPrefix, start, digits),
                  last: formatSerialNumber(cleanPrefix, end, digits),
                  count: end - start + 1,
              }
            : null

    const conflicting = isActive
        ? allSeries.find(
              (other) =>
                  other.id !== series?.id &&
                  other.isActive &&
                  other.branchId === branchId &&
                  other.documentType === documentType,
          )
        : undefined

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
                {used && (
                    <Alert type="info" showIcon duration={0} className="mb-4">
                        <span className="font-normal">
                            This series has been used. To change the range, register a new series.
                        </span>
                    </Alert>
                )}
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FormItem
                        label="Branch"
                        asterisk
                        invalid={!!errors.branchId}
                        errorMessage={errors.branchId?.message}
                    >
                        <Controller
                            name="branchId"
                            control={control}
                            render={({ field }) => (
                                <Select<Option>
                                    options={branchOptions}
                                    value={branchOptions.find((option) => option.value === field.value) ?? null}
                                    onChange={(option) => field.onChange(option?.value ?? '')}
                                    onBlur={field.onBlur}
                                    placeholder="Select a branch"
                                    isDisabled={used}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Document type"
                        asterisk
                        invalid={!!errors.documentType}
                        errorMessage={errors.documentType?.message}
                    >
                        <Controller
                            name="documentType"
                            control={control}
                            render={({ field }) => (
                                <Select<Option<DocumentType>>
                                    options={DOCUMENT_TYPE_OPTIONS}
                                    value={DOCUMENT_TYPE_OPTIONS.find((option) => option.value === field.value) ?? null}
                                    onChange={(option) => field.onChange(option?.value)}
                                    isSearchable={false}
                                    isDisabled={used}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Prefix" invalid={!!errors.prefix} errorMessage={errors.prefix?.message}>
                        <Controller
                            name="prefix"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} placeholder="e.g. SI (optional)" disabled={used} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Digits" asterisk invalid={!!errors.padding} errorMessage={errors.padding?.message}>
                        <Controller
                            name="padding"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    type="number"
                                    min={MIN_SERIAL_DIGITS}
                                    max={12}
                                    disabled={used}
                                />
                            )}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            At least {MIN_SERIAL_DIGITS}, padded with leading zeroes.
                        </p>
                    </FormItem>
                    <FormItem
                        label="Start number"
                        asterisk
                        invalid={!!errors.startNumber}
                        errorMessage={errors.startNumber?.message}
                    >
                        <Controller
                            name="startNumber"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    type="number"
                                    min={1}
                                    disabled={used}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="End number"
                        asterisk
                        invalid={!!errors.endNumber}
                        errorMessage={errors.endNumber?.message}
                    >
                        <Controller
                            name="endNumber"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    type="number"
                                    min={1}
                                    placeholder="e.g. 500000"
                                    disabled={used}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="mb-6 rounded-xl bg-gray-50 p-4 sm:col-span-2 dark:bg-gray-700/50">
                        <div className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                            Preview
                        </div>
                        {preview ? (
                            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-6">
                                <div className="text-gray-500 dark:text-gray-400">
                                    First:{' '}
                                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                                        {preview.first}
                                    </span>
                                </div>
                                <div className="text-gray-500 dark:text-gray-400">
                                    Last:{' '}
                                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                                        {preview.last}
                                    </span>
                                </div>
                                <div className="text-gray-500 dark:text-gray-400">
                                    {preview.count.toLocaleString()} numbers
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Enter the start and end numbers to see how your invoice numbers will look.
                            </div>
                        )}
                    </div>
                    <FormItem
                        label="Acknowledgment Certificate no. (ACCN)"
                        asterisk
                        invalid={!!errors.acNumber}
                        errorMessage={errors.acNumber?.message}
                    >
                        <Controller
                            name="acNumber"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} placeholder="As printed on your CAS AC" disabled={used} />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Date issued"
                        asterisk
                        invalid={!!errors.acDate}
                        errorMessage={errors.acDate?.message}
                    >
                        <Controller
                            name="acDate"
                            control={control}
                            render={({ field }) => <Input {...field} type="date" disabled={used} />}
                        />
                    </FormItem>
                    {conflicting && (
                        <Alert type="warning" showIcon duration={0} className="mb-6 sm:col-span-2">
                            <span className="font-normal">
                                This branch already has an active {DOCUMENT_TYPE_LABELS[conflicting.documentType]}{' '}
                                series (
                                {formatSeriesRange(
                                    conflicting.prefix,
                                    conflicting.startNumber,
                                    conflicting.endNumber,
                                    conflicting.padding,
                                )}
                                ). Only one can be active at a time — turn the other one off first, or save this one as
                                inactive.
                            </span>
                        </Alert>
                    )}
                    <FormItem label="Active" className="mb-0 sm:col-span-2">
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <div className="flex items-start gap-3">
                                    <Switcher checked={field.value} onChange={(checked) => field.onChange(checked)} />
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {field.value
                                            ? 'New invoices of this type at this branch take their numbers from this series.'
                                            : 'Not used for new invoices.'}
                                    </span>
                                </div>
                            )}
                        />
                    </FormItem>
                </div>
            </Form>
        </FormProvider>
    )
}
