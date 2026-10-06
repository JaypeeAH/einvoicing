'use client'

import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Select from '@/components/ui/Select'
import Segment from '@/components/ui/Segment'
import StatusBadge from '@/components/shared/StatusBadge'
import { assessCoverage } from '@/utils/compliance/assessCoverage'
import { CoverageAnswersSchema, type CoverageAnswers } from '@/@types/compliance/CoverageAssessment'
import { COVERAGE_STATUS_OPTIONS } from '@/@types/compliance/CoverageStatusOptions'
import { TAXPAYER_SIZES, TAXPAYER_SIZE_LABELS, type TaxpayerSize } from '@/constants/bir.constant'
import type { Option } from '@/@types/common'

const TAXPAYER_SIZE_OPTIONS: Option<TaxpayerSize>[] = TAXPAYER_SIZES.map((value) => ({
    value,
    label: TAXPAYER_SIZE_LABELS[value],
}))

type YesNoField = Exclude<keyof CoverageAnswers, 'taxpayerSize'>

const QUESTIONS: { name: YesNoField; label: string; hint?: string }[] = [
    {
        name: 'sellsOnline',
        label: 'Do you sell goods or services online?',
        hint: 'Your own website, online marketplaces or social media shops.',
    },
    {
        name: 'isLargeTaxpayerService',
        label: 'Are you under the BIR Large Taxpayers Service (LTS)?',
    },
    {
        name: 'usesCasOrInvoicingSoftware',
        label: 'Do you issue invoices from accounting or invoicing software?',
        hint: 'Including this system or any registered CAS/CBA.',
    },
    { name: 'isExporter', label: 'Are you an exporter?' },
    {
        name: 'isRegisteredBusinessEnterprise',
        label: 'Are you a registered business enterprise?',
        hint: 'For example PEZA, BOI or another investment promotion agency.',
    },
    { name: 'usesPosOnly', label: 'Do you issue invoices only from POS machines or cash registers?' },
]

const EMPTY_ANSWERS: CoverageAnswers = {
    taxpayerSize: null,
    sellsOnline: null,
    isLargeTaxpayerService: null,
    usesCasOrInvoicingSoftware: null,
    isExporter: null,
    isRegisteredBusinessEnterprise: null,
    usesPosOnly: null,
}

interface CoverageFormProps {
    id: string
    /** Previous answers to start from. */
    answers?: CoverageAnswers | null
    /** Default classification when there are no previous answers (from the company profile). */
    defaultTaxpayerSize?: TaxpayerSize | null
    onSubmit: (data: CoverageAnswers) => Promise<void>
}

/** "Do I need to e-invoice?" questionnaire with a live preview of the result. */
export default function CoverageForm({ id, answers, defaultTaxpayerSize, onSubmit }: CoverageFormProps) {
    const form = useForm<CoverageAnswers>({
        resolver: zodResolver(CoverageAnswersSchema),
        defaultValues: {
            ...EMPTY_ANSWERS,
            ...answers,
            taxpayerSize: answers?.taxpayerSize ?? defaultTaxpayerSize ?? null,
        },
    })
    const { control, handleSubmit } = form
    const values = useWatch({ control })
    const preview = assessCoverage({ ...EMPTY_ANSWERS, ...values })

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormItem
                    label="Taxpayer classification (EOPT)"
                    extra="As shown in your BIR records or notice of classification"
                >
                    <Controller
                        name="taxpayerSize"
                        control={control}
                        render={({ field }) => (
                            <Select<Option<TaxpayerSize>>
                                options={TAXPAYER_SIZE_OPTIONS}
                                value={TAXPAYER_SIZE_OPTIONS.find((option) => option.value === field.value) ?? null}
                                onChange={(option) => field.onChange(option?.value ?? null)}
                                placeholder="Select your classification"
                                isSearchable={false}
                            />
                        )}
                    />
                </FormItem>
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
                    {QUESTIONS.map((question) => (
                        <Controller
                            key={question.name}
                            name={question.name}
                            control={control}
                            render={({ field }) => (
                                <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-800 dark:text-gray-100">
                                            {question.label}
                                        </div>
                                        {question.hint && <div className="text-sm text-gray-500">{question.hint}</div>}
                                    </div>
                                    <Segment
                                        size="sm"
                                        className="shrink-0 self-start sm:self-center"
                                        value={field.value === null ? '' : field.value ? 'yes' : 'no'}
                                        onChange={(value) =>
                                            field.onChange(value === 'yes' ? true : value === 'no' ? false : null)
                                        }
                                    >
                                        <Segment.Item value="yes" type="button">
                                            Yes
                                        </Segment.Item>
                                        <Segment.Item value="no" type="button">
                                            No
                                        </Segment.Item>
                                    </Segment>
                                </div>
                            )}
                        />
                    ))}
                </div>
                <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-500">Your result</span>
                        <StatusBadge option={COVERAGE_STATUS_OPTIONS[preview.status]} />
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{preview.headline}</div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
                        {preview.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                        ))}
                    </ul>
                </div>
            </Form>
        </FormProvider>
    )
}
