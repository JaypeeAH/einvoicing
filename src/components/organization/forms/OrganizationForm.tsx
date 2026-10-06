'use client'

import { Controller, FormProvider, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Segment from '@/components/ui/Segment'
import Switcher from '@/components/ui/Switcher'
import Alert from '@/components/ui/Alert'
import {
    OrganizationSettingsFormSchema,
    type OrganizationSettingsFormData,
} from '@/@types/organizations/forms/OrganizationFormData'
import {
    TAXPAYER_SIZES,
    TAXPAYER_SIZE_LABELS,
    VAT_REGISTRATION_LABELS,
    type TaxpayerSize,
    type VatRegistration,
} from '@/constants/bir.constant'
import type { Organization } from '@/@types/organizations/Organization'
import type { Option } from '@/@types/common'
import type { ReactNode } from 'react'

const TAXPAYER_SIZE_OPTIONS: Option<TaxpayerSize>[] = TAXPAYER_SIZES.map((value) => ({
    value,
    label: TAXPAYER_SIZE_LABELS[value],
}))

const VAT_REGISTRATION_HELP: Record<VatRegistration, string> = {
    vat: 'Choose this if your COR lists Value-Added Tax. Your invoices show the 12% VAT separately.',
    non_vat: 'Choose this if your COR lists percentage tax instead of VAT. Your invoices won’t charge VAT.',
}

export const getOrganizationFormDefaults = (
    organization?: Organization | null,
): DefaultValues<OrganizationSettingsFormData> => ({
    registeredName: organization?.registeredName ?? '',
    businessName: organization?.businessName ?? '',
    tin: organization?.tin ?? '',
    vatRegistration: organization?.vatRegistration ?? 'vat',
    taxpayerSize: organization?.taxpayerSize ?? undefined,
    rdoCode: organization?.rdoCode ?? '',
    registeredAddress: organization?.registeredAddress ?? '',
    zipCode: organization?.zipCode ?? '',
    lineOfBusiness: organization?.lineOfBusiness ?? '',
    email: organization?.email ?? '',
    phone: organization?.phone ?? '',
    pricesIncludeVat: organization?.pricesIncludeVat ?? true,
    eisTransmissionEnabled: organization?.eisTransmissionEnabled ?? false,
})

interface SectionTitleProps {
    children: ReactNode
}

/** Small heading that groups related fields. */
function SectionTitle({ children }: SectionTitleProps) {
    return (
        <h6 className="mb-4 border-b border-gray-100 pb-2 font-semibold text-gray-900 sm:col-span-2 dark:border-gray-700 dark:text-gray-100">
            {children}
        </h6>
    )
}

interface HelpTextProps {
    children: ReactNode
}

/** Plain-language hint shown under a field. */
function HelpText({ children }: HelpTextProps) {
    return <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{children}</p>
}

interface OrganizationFormProps {
    id: string
    /** The saved profile when editing (enables the VAT-change warning). Omit when registering. */
    organization?: Organization | null
    onSubmit: (data: OrganizationSettingsFormData) => Promise<void>
    /** Extra fields rendered at the end of the form (they can use `useFormContext`). */
    children?: ReactNode
}

/**
 * Taxpayer profile exactly as on the BIR Certificate of Registration (Form 2303). Used by onboarding and the
 * company settings page.
 */
export default function OrganizationForm({ id, organization, onSubmit, children }: OrganizationFormProps) {
    const form = useForm<OrganizationSettingsFormData>({
        resolver: zodResolver(OrganizationSettingsFormSchema),
        defaultValues: getOrganizationFormDefaults(organization),
    })
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form
    const vatRegistration = useWatch({ control, name: 'vatRegistration' })
    const vatChanged = !!organization && vatRegistration !== organization.vatRegistration

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <SectionTitle>Registration details</SectionTitle>
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
                                <Input {...field} placeholder="e.g. Dela Cruz Trading Corporation" />
                            )}
                        />
                        <HelpText>
                            Type it exactly as shown on your Certificate of Registration (BIR Form 2303), including
                            “Inc.” or “Corp.”. For sole proprietors, this is the owner’s full name.
                        </HelpText>
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
                                <Input {...field} value={field.value ?? ''} placeholder="Trade name, if different" />
                            )}
                        />
                    </FormItem>
                    <FormItem label="TIN" asterisk invalid={!!errors.tin} errorMessage={errors.tin?.message}>
                        <Controller
                            name="tin"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="123-456-789" inputMode="numeric" />}
                        />
                        <HelpText>The 9-digit TIN. Branch codes are added per branch.</HelpText>
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
                        <HelpText>Your Revenue District Office, shown on your COR.</HelpText>
                    </FormItem>
                    <FormItem
                        label="VAT registration"
                        asterisk
                        invalid={!!errors.vatRegistration}
                        errorMessage={errors.vatRegistration?.message}
                    >
                        <Controller
                            name="vatRegistration"
                            control={control}
                            render={({ field }) => (
                                <Segment
                                    size="sm"
                                    className="w-full"
                                    value={field.value}
                                    onChange={(value) => typeof value === 'string' && value && field.onChange(value)}
                                >
                                    <Segment.Item value="vat" className="flex-1">
                                        {VAT_REGISTRATION_LABELS.vat}
                                    </Segment.Item>
                                    <Segment.Item value="non_vat" className="flex-1">
                                        Non-VAT
                                    </Segment.Item>
                                </Segment>
                            )}
                        />
                        <HelpText>{VAT_REGISTRATION_HELP[vatRegistration ?? 'vat']}</HelpText>
                    </FormItem>
                    <FormItem
                        label="Taxpayer classification"
                        asterisk
                        invalid={!!errors.taxpayerSize}
                        errorMessage={errors.taxpayerSize?.message}
                    >
                        <Controller
                            name="taxpayerSize"
                            control={control}
                            render={({ field }) => (
                                <Select<Option<TaxpayerSize>>
                                    options={TAXPAYER_SIZE_OPTIONS}
                                    value={TAXPAYER_SIZE_OPTIONS.find((option) => option.value === field.value) ?? null}
                                    onChange={(option) => field.onChange(option?.value)}
                                    onBlur={field.onBlur}
                                    placeholder="Select by yearly gross sales"
                                    isSearchable={false}
                                />
                            )}
                        />
                        <HelpText>
                            Based on your yearly gross sales (RR 8-2024). Micro taxpayers are not required to issue
                            e-invoices by the 2026 deadline.
                        </HelpText>
                    </FormItem>
                    {vatChanged && (
                        <Alert type="warning" showIcon duration={0} className="mb-6 sm:col-span-2">
                            <span className="font-normal">
                                Update your BIR registration first. Change this only after the BIR has updated your
                                Certificate of Registration — it changes how every new invoice is taxed.
                            </span>
                        </Alert>
                    )}
                    <FormItem
                        label="Registered address"
                        asterisk
                        invalid={!!errors.registeredAddress}
                        errorMessage={errors.registeredAddress?.message}
                        className="sm:col-span-2"
                    >
                        <Controller
                            name="registeredAddress"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    textArea
                                    rows={2}
                                    placeholder="Unit, building, street, barangay, city or municipality, province"
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="ZIP code"
                        asterisk
                        invalid={!!errors.zipCode}
                        errorMessage={errors.zipCode?.message}
                    >
                        <Controller
                            name="zipCode"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="e.g. 1100" inputMode="numeric" />}
                        />
                    </FormItem>
                    <FormItem
                        label="Line of business"
                        invalid={!!errors.lineOfBusiness}
                        errorMessage={errors.lineOfBusiness?.message}
                    >
                        <Controller
                            name="lineOfBusiness"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} value={field.value ?? ''} placeholder="e.g. Retail of hardware" />
                            )}
                        />
                    </FormItem>

                    <SectionTitle>Contact details</SectionTitle>
                    <FormItem label="Email" invalid={!!errors.email} errorMessage={errors.email?.message}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    type="email"
                                    placeholder="billing@business.ph"
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Phone" invalid={!!errors.phone} errorMessage={errors.phone?.message}>
                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => <Input {...field} value={field.value ?? ''} type="tel" />}
                        />
                    </FormItem>

                    {vatRegistration === 'vat' && (
                        <>
                            <SectionTitle>Invoice defaults</SectionTitle>
                            <FormItem label="Prices include VAT" className="sm:col-span-2">
                                <Controller
                                    name="pricesIncludeVat"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex items-start gap-3">
                                            <Switcher
                                                checked={field.value}
                                                onChange={(checked) => field.onChange(checked)}
                                            />
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {field.value
                                                    ? 'The prices you enter already include 12% VAT. The app works out the VAT portion for you.'
                                                    : 'The prices you enter exclude VAT. The app adds 12% VAT on top.'}{' '}
                                                You can still change this on each invoice.
                                            </span>
                                        </div>
                                    )}
                                />
                            </FormItem>
                        </>
                    )}
                    {children}
                </div>
            </Form>
        </FormProvider>
    )
}
