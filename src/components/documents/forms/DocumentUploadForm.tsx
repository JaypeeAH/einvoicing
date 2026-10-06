'use client'

import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import {
    DOCUMENT_ACCEPT,
    DocumentUploadFormSchema,
    type DocumentUploadFormData,
} from '@/@types/documents/forms/DocumentUploadFormData'
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from '@/constants/bir.constant'
import classNames from '@/utils/classNames'
import { formatFileSize } from '@/utils/fileSize'
import type { Option } from '@/@types/common'

const CATEGORY_OPTIONS: Option<DocumentCategory>[] = DOCUMENT_CATEGORIES.map((value) => ({
    value,
    label: DOCUMENT_CATEGORY_LABELS[value],
}))

interface DocumentUploadFormProps {
    id: string
    defaultCategory?: DocumentCategory
    onSubmit: (data: DocumentUploadFormData & { file: File }) => Promise<void>
}

/** Category, title and file (PDF/PNG/JPG up to 10 MB) for a compliance document. */
export default function DocumentUploadForm({ id, defaultCategory = 'cor', onSubmit }: DocumentUploadFormProps) {
    const form = useForm<DocumentUploadFormData>({
        resolver: zodResolver(DocumentUploadFormSchema),
        defaultValues: {
            category: defaultCategory,
            title: DOCUMENT_CATEGORY_LABELS[defaultCategory],
            file: null,
        },
    })
    const {
        control,
        handleSubmit,
        getValues,
        setValue,
        formState: { errors, dirtyFields },
    } = form

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit((data) => onSubmit({ ...data, file: data.file as File }))} noValidate>
                <FormItem label="Category" asterisk invalid={!!errors.category} errorMessage={errors.category?.message}>
                    <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                            <Select<Option<DocumentCategory>>
                                options={CATEGORY_OPTIONS}
                                value={CATEGORY_OPTIONS.find((option) => option.value === field.value)}
                                onChange={(option) => {
                                    if (!option) return
                                    field.onChange(option.value)
                                    // Keep the suggested title in step with the category until the user types their own
                                    if (!dirtyFields.title || !getValues('title')) {
                                        setValue('title', DOCUMENT_CATEGORY_LABELS[option.value])
                                    }
                                }}
                                isSearchable={false}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Title" asterisk invalid={!!errors.title} errorMessage={errors.title?.message}>
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="e.g. COR 2303 — Head office" />}
                    />
                </FormItem>
                <FormItem
                    label="File"
                    asterisk
                    invalid={!!errors.file}
                    errorMessage={errors.file?.message}
                    extra="PDF, PNG or JPG, up to 10 MB"
                    className="mb-0"
                >
                    <Controller
                        name="file"
                        control={control}
                        render={({ field }) => (
                            <div>
                                <input
                                    type="file"
                                    accept={DOCUMENT_ACCEPT}
                                    name={field.name}
                                    onBlur={field.onBlur}
                                    onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
                                    className={classNames(
                                        'block w-full rounded-xl border bg-white text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300',
                                        'file:mr-3 file:cursor-pointer file:border-0 file:bg-primary-subtle file:px-4 file:py-2.5 file:font-semibold file:text-primary',
                                        errors.file ? 'border-error' : 'border-gray-300 dark:border-gray-600',
                                    )}
                                />
                                {field.value instanceof File && (
                                    <div className="mt-1 text-xs text-gray-500">{formatFileSize(field.value.size)}</div>
                                )}
                            </div>
                        )}
                    />
                </FormItem>
            </Form>
        </FormProvider>
    )
}
