'use client'

import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { EisConnectionFormSchema, type EisConnectionFormData } from '@/@types/transmissions/forms/EisConnectionFormData'
import {
    EIS_ENVIRONMENTS,
    EIS_ENVIRONMENT_LABELS,
    EIS_SANDBOX_BASE_URL,
    type EisEnvironment,
} from '@/constants/bir.constant'
import type { EisConnectionSummary } from '@/@types/transmissions/EisConnectionSummary'
import type { Option } from '@/@types/common'

const ENVIRONMENT_OPTIONS: Option<EisEnvironment>[] = EIS_ENVIRONMENTS.map((value) => ({
    value,
    label: EIS_ENVIRONMENT_LABELS[value],
}))

const SAVED_SECRET = 'Saved — leave blank to keep it'

interface EisConnectionFormProps {
    id: string
    connection: EisConnectionSummary | null
    onSubmit: (data: EisConnectionFormData) => Promise<void>
}

/** Credentials from the EIS Certification portal. Secrets are write-only: they are never shown again. */
export default function EisConnectionForm({ id, connection, onSubmit }: EisConnectionFormProps) {
    const saved = !!connection?.configured
    const form = useForm<EisConnectionFormData>({
        resolver: zodResolver(EisConnectionFormSchema),
        defaultValues: {
            environment: connection?.environment ?? 'sandbox',
            apiBaseUrl: connection?.apiBaseUrl ?? EIS_SANDBOX_BASE_URL,
            accreditationId: connection?.accreditationId ?? '',
            applicationId: connection?.applicationId ?? '',
            userId: connection?.userId ?? '',
            password: '',
            applicationKey: '',
            jwsKeyId: connection?.jwsKeyId ?? '',
            jwsPrivateKey: '',
        },
    })
    const {
        control,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors },
    } = form

    const onEnvironmentChange = (environment: EisEnvironment) => {
        const url = getValues('apiBaseUrl')
        // Production uses the URL BIR e-mails with the PTT
        if (environment === 'production' && url === EIS_SANDBOX_BASE_URL) setValue('apiBaseUrl', '')
        if (environment === 'sandbox' && !url) setValue('apiBaseUrl', EIS_SANDBOX_BASE_URL)
    }

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FormItem label="Environment" asterisk invalid={!!errors.environment}>
                        <Controller
                            name="environment"
                            control={control}
                            render={({ field }) => (
                                <Select<Option<EisEnvironment>>
                                    options={ENVIRONMENT_OPTIONS}
                                    value={ENVIRONMENT_OPTIONS.find((option) => option.value === field.value)}
                                    onChange={(option) => {
                                        if (!option) return
                                        field.onChange(option.value)
                                        onEnvironmentChange(option.value)
                                    }}
                                    isSearchable={false}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="API address"
                        asterisk
                        invalid={!!errors.apiBaseUrl}
                        errorMessage={errors.apiBaseUrl?.message}
                        extra="Production: the URL BIR e-mails when the PTT is approved"
                    >
                        <Controller
                            name="apiBaseUrl"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder={EIS_SANDBOX_BASE_URL} />}
                        />
                    </FormItem>
                    <FormItem
                        label="EIS Cert Number"
                        asterisk
                        invalid={!!errors.accreditationId}
                        errorMessage={errors.accreditationId?.message}
                        extra="Sandbox: the Test EIS Cert Number"
                    >
                        <Controller
                            name="accreditationId"
                            control={control}
                            render={({ field }) => <Input {...field} inputMode="numeric" maxLength={8} />}
                        />
                    </FormItem>
                    <FormItem
                        label="Application ID"
                        asterisk
                        invalid={!!errors.applicationId}
                        errorMessage={errors.applicationId?.message}
                    >
                        <Controller
                            name="applicationId"
                            control={control}
                            render={({ field }) => <Input {...field} autoComplete="off" />}
                        />
                    </FormItem>
                    <FormItem
                        label="Application key"
                        asterisk={!saved}
                        invalid={!!errors.applicationKey}
                        errorMessage={errors.applicationKey?.message}
                    >
                        <Controller
                            name="applicationKey"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    type="password"
                                    autoComplete="off"
                                    placeholder={saved ? SAVED_SECRET : ''}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Portal user ID"
                        asterisk
                        invalid={!!errors.userId}
                        errorMessage={errors.userId?.message}
                        extra="Your EIS Certification portal username"
                    >
                        <Controller
                            name="userId"
                            control={control}
                            render={({ field }) => <Input {...field} autoComplete="off" />}
                        />
                    </FormItem>
                    <FormItem
                        label="Portal password"
                        asterisk={!saved}
                        invalid={!!errors.password}
                        errorMessage={errors.password?.message}
                        extra="Required by the Authentication API; stored encrypted"
                    >
                        <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder={saved ? SAVED_SECRET : ''}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Signing key ID"
                        asterisk
                        invalid={!!errors.jwsKeyId}
                        errorMessage={errors.jwsKeyId?.message}
                        extra="Key ID of the digital signing key pair"
                    >
                        <Controller
                            name="jwsKeyId"
                            control={control}
                            render={({ field }) => <Input {...field} autoComplete="off" />}
                        />
                    </FormItem>
                    <FormItem
                        label="Signing private key"
                        asterisk={!saved}
                        invalid={!!errors.jwsPrivateKey}
                        errorMessage={errors.jwsPrivateKey?.message}
                        extra="From the credential file downloaded after generating the key pair"
                        className="mb-0 sm:col-span-2"
                    >
                        <Controller
                            name="jwsPrivateKey"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    textArea
                                    rows={4}
                                    autoComplete="off"
                                    spellCheck={false}
                                    className="font-mono text-xs"
                                    placeholder={saved ? SAVED_SECRET : '-----BEGIN PRIVATE KEY-----'}
                                />
                            )}
                        />
                    </FormItem>
                </div>
            </Form>
        </FormProvider>
    )
}
