'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, FormProvider, useForm, useWatch, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess, toastWarning } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import InvoiceBuyerFields from '@/components/invoices/forms/InvoiceBuyerFields'
import InvoiceLinesEditor from '@/components/invoices/forms/InvoiceLinesEditor'
import InvoiceTotalsPreview from '@/components/invoices/forms/InvoiceTotalsPreview'
import ReferenceInvoiceSelect, { type ReferenceInvoice } from '@/components/invoices/ReferenceInvoiceSelect'
import { useBranchesStore } from '@/stores/BranchesStore'
import { useSeriesStore } from '@/stores/SeriesStore'
import { useSessionStore } from '@/stores/SessionStore'
import { apiIssueInvoice, apiSaveInvoiceDraft } from '@/services/invoices'
import { calculateInvoice } from '@/utils/invoices/calculateInvoice'
import { findActiveSeries } from '@/utils/invoices/invoiceFormData'
import { formatSerialNumber } from '@/utils/invoices/invoiceNumber'
import { tryGetFieldErrors } from '@/utils/errors'
import { formatPeso } from '@/utils/money'
import { InvoiceFormSchema, type InvoiceFormData } from '@/@types/invoices/forms/InvoiceFormData'
import {
    DOCUMENT_TYPE_LABELS,
    SPECIAL_DISCOUNTS,
    SPECIAL_DISCOUNT_TYPES,
    isMemoDocumentType,
    type SpecialDiscountType,
} from '@/constants/bir.constant'
import { getInvoicePath, seriesPath } from '@/configs/app.config'
import { IssueIcon, SaveIcon } from '@/configs/icons.config'
import type { CustomerMeta } from '@/@types/customers/CustomerMeta'
import type { Option } from '@/@types/common'

interface InvoiceEditorProps {
    defaultValues: InvoiceFormData
    /** Set when editing an existing draft. */
    invoiceId?: string
    /** Pre-selected customer / reference invoice for display. */
    initialCustomer?: CustomerMeta | null
    initialReference?: ReferenceInvoice | null
}

const WITHHOLDING_OPTIONS: Option<number>[] = [
    { value: 0, label: 'None' },
    { value: 0.01, label: '1% — goods' },
    { value: 0.02, label: '2% — services' },
    { value: 0.05, label: '5%' },
    { value: 0.1, label: '10% — professional fees' },
    { value: 0.15, label: '15%' },
]

const PAYMENT_TERMS = ['Cash', 'Cash on delivery', 'Net 7 days', 'Net 15 days', 'Net 30 days', 'Net 60 days']

const SPECIAL_DISCOUNT_OPTIONS: Option<SpecialDiscountType>[] = SPECIAL_DISCOUNT_TYPES.map((value) => ({
    value,
    label: `${SPECIAL_DISCOUNTS[value].label} (${SPECIAL_DISCOUNTS[value].rate * 100}%)`,
}))

/** Create or edit a draft invoice, credit memo or debit memo, then save or issue it. */
export default function InvoiceEditor({
    defaultValues,
    invoiceId,
    initialCustomer,
    initialReference,
}: InvoiceEditorProps) {
    const router = useRouter()
    const organization = useSessionStore((state) => state.user?.organization)
    const branches = useBranchesStore((state) => state.data)
    const series = useSeriesStore((state) => state.data)

    const [customer, setCustomer] = useState<CustomerMeta | null>(initialCustomer ?? null)
    const [reference, setReference] = useState<ReferenceInvoice | null>(initialReference ?? null)
    const [saving, setSaving] = useState<'draft' | 'issue' | null>(null)
    const [confirmIssueId, setConfirmIssueId] = useState<string | null>(null)

    const form = useForm<InvoiceFormData>({
        resolver: zodResolver(InvoiceFormSchema),
        defaultValues,
    })
    const {
        control,
        handleSubmit,
        setValue,
        setError,
        formState: { errors },
    } = form

    const documentType = useWatch({ control, name: 'documentType' })
    const branchId = useWatch({ control, name: 'branchId' })
    const lines = useWatch({ control, name: 'lines' })
    const pricesIncludeVat = useWatch({ control, name: 'pricesIncludeVat' })
    const withholdingTaxRate = Number(useWatch({ control, name: 'withholdingTaxRate' }) || 0)
    const specialDiscount = useWatch({ control, name: 'specialDiscount' })

    const isMemo = isMemoDocumentType(documentType)
    const isVatSeller = organization?.vatRegistration !== 'non_vat'
    const activeBranches = useMemo(() => (branches ?? []).filter((branch) => branch.status === 'active'), [branches])
    const branchOptions = activeBranches.map((branch) => ({
        value: branch.id,
        label: `${branch.code} — ${branch.name}`,
    }))
    const activeSeries = findActiveSeries(series, branchId, documentType)

    const preview = useMemo(
        () =>
            calculateInvoice({
                lines: (lines ?? []).map((line) => ({
                    quantity: Number(line.quantity) || 0,
                    unitPrice: Number(line.unitPrice) || 0,
                    discountAmount: Number(line.discountAmount) || 0,
                    taxTreatment: line.taxTreatment,
                    specialDiscount: !!line.specialDiscount,
                })),
                pricesIncludeVat,
                sellerVatRegistration: isVatSeller ? 'vat' : 'non_vat',
                specialDiscountType: specialDiscount?.type ?? null,
                withholdingTaxRate,
            }),
        [lines, pricesIncludeVat, isVatSeller, specialDiscount?.type, withholdingTaxRate],
    )

    const applyServerErrors = (error: unknown) => {
        const problems = tryGetFieldErrors(error)
        problems.forEach((problem) => {
            setError(problem.field as FieldPath<InvoiceFormData>, { type: 'server', message: problem.message })
        })
        return problems.length > 0
    }

    const save = async (data: InvoiceFormData, intent: 'draft' | 'issue') => {
        setSaving(intent)
        try {
            const saved = await apiSaveInvoiceDraft(data, invoiceId)
            if (intent === 'draft') {
                toastSuccess('Draft saved.')
                router.push(getInvoicePath(saved.id))
            } else {
                setConfirmIssueId(saved.id)
            }
        } catch (error) {
            if (!applyServerErrors(error)) toastError('Could not save the draft.', error)
        } finally {
            setSaving(null)
        }
    }

    const issue = async () => {
        if (!confirmIssueId) return
        setSaving('issue')
        try {
            const issued = await apiIssueInvoice(confirmIssueId)
            toastSuccess(`${DOCUMENT_TYPE_LABELS[issued.documentType]} ${issued.invoiceNumber} issued.`)
            router.push(getInvoicePath(issued.id))
        } catch (error) {
            applyServerErrors(error)
            toastWarning('The draft was saved but could not be issued.', error)
            router.push(getInvoicePath(confirmIssueId))
        } finally {
            setSaving(null)
            setConfirmIssueId(null)
        }
    }

    const title = `${invoiceId ? 'Edit draft' : 'New'} ${DOCUMENT_TYPE_LABELS[documentType].toLowerCase()}`

    return (
        <FormProvider {...form}>
            <Form onSubmit={handleSubmit((data) => save(data, 'draft'))} noValidate>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="heading-text">{title}</h3>
                        <p className="mt-1 text-gray-500">
                            Save as a draft to review later. The serial number is assigned only when you issue it.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            type="submit"
                            icon={<SaveIcon />}
                            loading={saving === 'draft'}
                            disabled={!!saving}
                        >
                            Save draft
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<IssueIcon />}
                            loading={saving === 'issue'}
                            disabled={!!saving || !activeSeries}
                            onClick={handleSubmit((data) => save(data, 'issue'))}
                        >
                            Save &amp; issue
                        </Button>
                    </div>
                </div>

                {!activeSeries && branchId && (
                    <Alert type="warning" showIcon className="mb-4" duration={0}>
                        There is no active {DOCUMENT_TYPE_LABELS[documentType].toLowerCase()} series for this branch.
                        You can save a draft, but{' '}
                        <Link href={seriesPath} className="font-semibold underline">
                            add a series
                        </Link>{' '}
                        before issuing.
                    </Alert>
                )}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div className="flex flex-col gap-4 xl:col-span-2">
                        <Card header={{ content: 'Document' }}>
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
                                            <Select
                                                options={branchOptions}
                                                value={
                                                    branchOptions.find((option) => option.value === field.value) ?? null
                                                }
                                                onChange={(option) => field.onChange(option?.value ?? '')}
                                                isDisabled={isMemo}
                                                placeholder="Select the issuing branch"
                                            />
                                        )}
                                    />
                                </FormItem>
                                <FormItem label="Next number">
                                    <div className="flex h-10 items-center font-mono text-gray-700 dark:text-gray-200">
                                        {activeSeries
                                            ? formatSerialNumber(
                                                  activeSeries.prefix,
                                                  activeSeries.nextNumber,
                                                  activeSeries.padding,
                                              )
                                            : '—'}
                                        <span className="ml-2 font-sans text-xs text-gray-400">
                                            assigned when issued
                                        </span>
                                    </div>
                                </FormItem>
                                <FormItem
                                    label="Date"
                                    asterisk
                                    invalid={!!errors.invoiceDate}
                                    errorMessage={errors.invoiceDate?.message}
                                >
                                    <Controller
                                        name="invoiceDate"
                                        control={control}
                                        render={({ field }) => <Input {...field} type="date" />}
                                    />
                                </FormItem>
                                <FormItem
                                    label="Due date"
                                    invalid={!!errors.dueDate}
                                    errorMessage={errors.dueDate?.message}
                                >
                                    <Controller
                                        name="dueDate"
                                        control={control}
                                        render={({ field }) => (
                                            <Input {...field} value={field.value ?? ''} type="date" />
                                        )}
                                    />
                                </FormItem>
                                <FormItem label="Payment terms" className="sm:col-span-2">
                                    <Controller
                                        name="paymentTerms"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    list="payment-terms"
                                                    placeholder="e.g. Cash, Net 30 days"
                                                />
                                                <datalist id="payment-terms">
                                                    {PAYMENT_TERMS.map((term) => (
                                                        <option key={term} value={term} />
                                                    ))}
                                                </datalist>
                                            </>
                                        )}
                                    />
                                </FormItem>
                            </div>
                        </Card>

                        {isMemo && (
                            <Card header={{ content: `${DOCUMENT_TYPE_LABELS[documentType]} details` }}>
                                <Alert type="info" showIcon className="mb-4" duration={0}>
                                    {documentType === 'credit_memo'
                                        ? 'A credit memo reduces an issued invoice (returns, price corrections, discounts). Enter only the amounts being credited.'
                                        : 'A debit memo increases an issued invoice (additional charges). Enter only the additional amounts.'}{' '}
                                    Issued invoices are never edited (RMC 98-2026).
                                </Alert>
                                <FormItem
                                    label="Invoice being adjusted"
                                    asterisk
                                    invalid={!!errors.referenceInvoiceId}
                                    errorMessage={errors.referenceInvoiceId?.message}
                                >
                                    <ReferenceInvoiceSelect
                                        value={reference}
                                        onChange={(selected) => {
                                            setReference(selected)
                                            setValue('referenceInvoiceId', selected?.id ?? null, { shouldDirty: true })
                                        }}
                                        invalid={!!errors.referenceInvoiceId}
                                        isDisabled={!!initialReference}
                                    />
                                </FormItem>
                                <FormItem
                                    label="Reason for the adjustment"
                                    asterisk
                                    invalid={!!errors.adjustmentReason}
                                    errorMessage={errors.adjustmentReason?.message}
                                    className="mb-0"
                                >
                                    <Controller
                                        name="adjustmentReason"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                value={field.value ?? ''}
                                                textArea
                                                rows={2}
                                                placeholder="e.g. 2 units returned damaged"
                                            />
                                        )}
                                    />
                                </FormItem>
                            </Card>
                        )}

                        <Card header={{ content: 'Sold to' }}>
                            <InvoiceBuyerFields customer={customer} onCustomerChange={setCustomer} locked={isMemo} />
                        </Card>

                        <Card
                            header={{
                                content: 'Items',
                                extra: isVatSeller && (
                                    <Controller
                                        name="pricesIncludeVat"
                                        control={control}
                                        render={({ field }) => (
                                            <label className="flex items-center gap-2 text-sm font-semibold">
                                                <Switcher
                                                    checked={field.value}
                                                    onChange={(checked) => field.onChange(checked)}
                                                />
                                                Prices include VAT
                                            </label>
                                        )}
                                    />
                                ),
                            }}
                        >
                            <InvoiceLinesEditor
                                calculated={preview.lines}
                                showSpecialDiscount={!!specialDiscount}
                                specialDiscountLabel={
                                    specialDiscount ? SPECIAL_DISCOUNTS[specialDiscount.type].label : undefined
                                }
                            />
                        </Card>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Card header={{ content: 'Summary' }} className="xl:sticky xl:top-20">
                            <InvoiceTotalsPreview
                                totals={preview.totals}
                                isVatSeller={isVatSeller}
                                withholdingTaxRate={withholdingTaxRate}
                            />
                        </Card>

                        {!isMemo && (
                            <Card header={{ content: 'Senior citizen, PWD & other special discounts' }}>
                                <label className="mb-3 flex items-center gap-3">
                                    <Switcher
                                        checked={!!specialDiscount}
                                        onChange={(checked) =>
                                            setValue(
                                                'specialDiscount',
                                                checked
                                                    ? {
                                                          type: 'senior_citizen',
                                                          idNumber: '',
                                                          holderName: '',
                                                          holderTin: '',
                                                      }
                                                    : null,
                                                { shouldDirty: true },
                                            )
                                        }
                                    />
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                                        Buyer presented a discount ID
                                    </span>
                                </label>
                                {specialDiscount ? (
                                    <>
                                        <FormItem label="Discount">
                                            <Controller
                                                name="specialDiscount.type"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select<Option<SpecialDiscountType>>
                                                        options={SPECIAL_DISCOUNT_OPTIONS}
                                                        value={SPECIAL_DISCOUNT_OPTIONS.find(
                                                            (option) => option.value === field.value,
                                                        )}
                                                        onChange={(option) => field.onChange(option?.value)}
                                                        isSearchable={false}
                                                    />
                                                )}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label={SPECIAL_DISCOUNTS[specialDiscount.type].idLabel}
                                            asterisk
                                            invalid={!!errors.specialDiscount?.idNumber}
                                            errorMessage={errors.specialDiscount?.idNumber?.message}
                                        >
                                            <Controller
                                                name="specialDiscount.idNumber"
                                                control={control}
                                                render={({ field }) => <Input {...field} />}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label="Cardholder name"
                                            asterisk
                                            invalid={!!errors.specialDiscount?.holderName}
                                            errorMessage={errors.specialDiscount?.holderName?.message}
                                        >
                                            <Controller
                                                name="specialDiscount.holderName"
                                                control={control}
                                                render={({ field }) => <Input {...field} />}
                                            />
                                        </FormItem>
                                        <FormItem label="Cardholder TIN (if any)" className="mb-2">
                                            <Controller
                                                name="specialDiscount.holderTin"
                                                control={control}
                                                render={({ field }) => <Input {...field} value={field.value ?? ''} />}
                                            />
                                        </FormItem>
                                        <p className="text-xs text-gray-500">
                                            Tick “Apply discount” on the qualifying lines. The discount is computed on
                                            the VAT-exclusive price and those lines become VAT-exempt.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-xs text-gray-500">
                                        Senior citizens and PWDs get 20% off qualified purchases, exempt from VAT. The
                                        ID number and name are printed on the invoice.
                                    </p>
                                )}
                                {errors.specialDiscount?.message && (
                                    <p className="mt-2 text-xs text-error">{errors.specialDiscount.message}</p>
                                )}
                            </Card>
                        )}

                        <Card header={{ content: 'More options' }}>
                            <FormItem label="Withholding tax the buyer will deduct">
                                <Controller
                                    name="withholdingTaxRate"
                                    control={control}
                                    render={({ field }) => (
                                        <Select<Option<number>>
                                            options={WITHHOLDING_OPTIONS}
                                            value={WITHHOLDING_OPTIONS.find(
                                                (option) => option.value === Number(field.value),
                                            )}
                                            onChange={(option) => field.onChange(option?.value ?? 0)}
                                            isSearchable={false}
                                        />
                                    )}
                                />
                            </FormItem>
                            {!isMemo && (
                                <FormItem
                                    label="Replaces manual invoice no."
                                    extra={
                                        <span className="ml-1 font-normal text-gray-500">(system downtime only)</span>
                                    }
                                >
                                    <Controller
                                        name="manualInvoiceReference"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="Leave blank normally"
                                            />
                                        )}
                                    />
                                </FormItem>
                            )}
                            <FormItem label="Notes printed on the invoice" className="mb-0">
                                <Controller
                                    name="notes"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} value={field.value ?? ''} textArea rows={3} />
                                    )}
                                />
                            </FormItem>
                        </Card>
                    </div>
                </div>
            </Form>

            <ConfirmDialog
                isOpen={!!confirmIssueId}
                type="warning"
                title={`Issue this ${DOCUMENT_TYPE_LABELS[documentType].toLowerCase()}?`}
                confirmText="Issue now"
                onClose={() => {
                    const id = confirmIssueId
                    setConfirmIssueId(null)
                    if (id) router.push(getInvoicePath(id))
                }}
                onConfirm={issue}
                closable={saving !== 'issue'}
                confirmButtonProps={{ loading: saving === 'issue' }}
            >
                <p>
                    It will receive serial number{' '}
                    <strong className="font-mono">
                        {activeSeries
                            ? formatSerialNumber(activeSeries.prefix, activeSeries.nextNumber, activeSeries.padding)
                            : ''}
                    </strong>{' '}
                    and can no longer be edited or deleted. Mistakes are corrected by voiding it or issuing a credit or
                    debit memo.
                </p>
                <p className="mt-2 text-sm">Total: {formatPeso(preview.totals.totalAmount)}</p>
            </ConfirmDialog>
        </FormProvider>
    )
}
