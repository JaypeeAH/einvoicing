'use client'

import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { RegistrationFormSchema, type RegistrationFormData } from '@/@types/registrations/forms/RegistrationFormData'
import {
    REGISTRATION_STATUSES,
    REGISTRATION_STATUS_LABELS,
    type RegistrationStatus,
    type RegistrationType,
} from '@/constants/bir.constant'
import { softwareName, softwareVersion } from '@/configs/app.config'
import type { Registration } from '@/@types/registrations/Registration'
import type { Option } from '@/@types/common'

const STATUS_OPTIONS: Option<RegistrationStatus>[] = REGISTRATION_STATUSES.map((value) => ({
    value,
    label: REGISTRATION_STATUS_LABELS[value],
}))

const REFERENCE_PLACEHOLDER: Record<RegistrationType, string> = {
    cor: 'OCN / COR number',
    cas_ac: 'Acknowledgment Certificate Control No. (ACCN)',
    pti: 'PTI number',
    eis_certification: 'Certification reference',
    ptt: 'PTT number',
}

export const getRegistrationFormDefaults = (
    registrationType: RegistrationType,
    registration?: Registration | null,
    suggestedDueOn?: string | null,
): RegistrationFormData => {
    const isSystemRecord = registrationType !== 'cor'
    return {
        registrationType,
        status: registration?.status ?? 'preparing',
        referenceNumber: registration?.referenceNumber ?? '',
        rdoCode: registration?.rdoCode ?? '',
        systemName: registration ? (registration.systemName ?? '') : isSystemRecord ? softwareName : '',
        systemVersion: registration ? (registration.systemVersion ?? '') : isSystemRecord ? softwareVersion : '',
        filedOn: registration?.filedOn ?? '',
        approvedOn: registration?.approvedOn ?? '',
        dueOn: registration?.dueOn ?? suggestedDueOn ?? '',
        notes: registration?.notes ?? '',
    }
}

interface RegistrationFormProps {
    id: string
    registrationType: RegistrationType
    registration?: Registration | null
    /** Pre-filled due date for a new record (EIS certification: 6 months after the PTI). */
    suggestedDueOn?: string | null
    onSubmit: (data: RegistrationFormData) => Promise<void>
}

/** Status, permit number and key dates of one BIR registration or permit. */
export default function RegistrationForm({
    id,
    registrationType,
    registration,
    suggestedDueOn,
    onSubmit,
}: RegistrationFormProps) {
    const form = useForm<RegistrationFormData>({
        resolver: zodResolver(RegistrationFormSchema),
        defaultValues: getRegistrationFormDefaults(registrationType, registration, suggestedDueOn),
    })
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form
    const isApproved = useWatch({ control, name: 'status' }) === 'approved'
    const isSystemRecord = registrationType !== 'cor'

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FormItem label="Status" asterisk invalid={!!errors.status} errorMessage={errors.status?.message}>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select<Option<RegistrationStatus>>
                                    options={STATUS_OPTIONS}
                                    value={STATUS_OPTIONS.find((option) => option.value === field.value)}
                                    onChange={(option) => option && field.onChange(option.value)}
                                    isSearchable={false}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="RDO code" invalid={!!errors.rdoCode} errorMessage={errors.rdoCode?.message}>
                        <Controller
                            name="rdoCode"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} value={field.value ?? ''} maxLength={5} placeholder="e.g. 043" />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Reference / permit number"
                        asterisk={isApproved}
                        invalid={!!errors.referenceNumber}
                        errorMessage={errors.referenceNumber?.message}
                        className="sm:col-span-2"
                    >
                        <Controller
                            name="referenceNumber"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder={REFERENCE_PLACEHOLDER[registrationType]}
                                />
                            )}
                        />
                    </FormItem>
                    {isSystemRecord && (
                        <>
                            <FormItem
                                label="System name"
                                invalid={!!errors.systemName}
                                errorMessage={errors.systemName?.message}
                                extra="As registered with BIR"
                            >
                                <Controller
                                    name="systemName"
                                    control={control}
                                    render={({ field }) => <Input {...field} value={field.value ?? ''} />}
                                />
                            </FormItem>
                            <FormItem
                                label="System version"
                                invalid={!!errors.systemVersion}
                                errorMessage={errors.systemVersion?.message}
                            >
                                <Controller
                                    name="systemVersion"
                                    control={control}
                                    render={({ field }) => <Input {...field} value={field.value ?? ''} />}
                                />
                            </FormItem>
                        </>
                    )}
                    <FormItem label="Filed on" invalid={!!errors.filedOn} errorMessage={errors.filedOn?.message}>
                        <Controller
                            name="filedOn"
                            control={control}
                            render={({ field }) => <Input {...field} type="date" value={field.value ?? ''} />}
                        />
                    </FormItem>
                    <FormItem
                        label="Approved on"
                        asterisk={isApproved}
                        invalid={!!errors.approvedOn}
                        errorMessage={errors.approvedOn?.message}
                    >
                        <Controller
                            name="approvedOn"
                            control={control}
                            render={({ field }) => <Input {...field} type="date" value={field.value ?? ''} />}
                        />
                    </FormItem>
                    <FormItem
                        label="Due on"
                        invalid={!!errors.dueOn}
                        errorMessage={errors.dueOn?.message}
                        extra={
                            registrationType === 'eis_certification'
                                ? '6 months after the PTI'
                                : 'Next deadline, if any'
                        }
                    >
                        <Controller
                            name="dueOn"
                            control={control}
                            render={({ field }) => <Input {...field} type="date" value={field.value ?? ''} />}
                        />
                    </FormItem>
                    <FormItem
                        label="Notes"
                        invalid={!!errors.notes}
                        errorMessage={errors.notes?.message}
                        className="mb-0 sm:col-span-2"
                    >
                        <Controller
                            name="notes"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    textArea
                                    rows={3}
                                    placeholder="e.g. who filed it, documents submitted, follow-ups with the RDO"
                                />
                            )}
                        />
                    </FormItem>
                </div>
            </Form>
        </FormProvider>
    )
}
