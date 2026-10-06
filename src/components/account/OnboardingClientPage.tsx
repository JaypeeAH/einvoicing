'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Steps from '@/components/ui/Steps'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import OrganizationForm from '@/components/organization/forms/OrganizationForm'
import { apiCreateOrganization } from '@/services/organization'
import { homePath } from '@/configs/app.config'
import { BranchIcon, InfoIcon, SeriesNavIcon, UsersIcon } from '@/configs/icons.config'
import type { OrganizationSettingsFormData } from '@/@types/organizations/forms/OrganizationFormData'

const FORM_ID = 'onboarding-form'

const NEXT_STEPS = [
    {
        icon: <BranchIcon />,
        text: 'Your head office is set up automatically as branch 00000. You can add other BIR-registered branches later.',
    },
    {
        icon: <UsersIcon />,
        text: 'You become the Owner of this business, so you can invite your team and give each person their own role.',
    },
    {
        icon: <SeriesNavIcon />,
        text: 'Next, the dashboard guides you through adding your invoice series and recording your BIR registrations.',
    },
]

/** First-run setup: registers the user's business (taxpayer profile) and makes them its owner. */
export default function OnboardingClientPage() {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: OrganizationSettingsFormData) => {
        setSaving(true)
        try {
            await apiCreateOrganization(data)
            toastSuccess('Your business is registered.')
            window.location.assign(homePath)
        } catch (error) {
            toastError('Could not register your business.', error)
            setSaving(false)
        }
    }

    return (
        <>
            <PageHeader
                title="Register your business"
                description="Enter your business details exactly as they appear on your BIR Certificate of Registration (Form 2303). They are printed on every invoice you issue."
            />
            <Card className="mb-4">
                <Steps current={0}>
                    <Steps.Item title="Business profile" />
                    <Steps.Item title="Invoice series" />
                    <Steps.Item title="BIR registrations" />
                </Steps>
            </Card>
            <div className="mb-4 rounded-2xl bg-info-subtle p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 font-semibold text-info">
                    <InfoIcon className="text-xl" /> What happens next
                </div>
                <ul className="flex flex-col gap-2">
                    {NEXT_STEPS.map((step) => (
                        <li key={step.text} className="flex gap-3 text-gray-700 dark:text-gray-200">
                            <span className="mt-0.5 shrink-0 text-lg text-info">{step.icon}</span>
                            <span>{step.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <Card
                footer={{
                    content: (
                        <div className="flex justify-end">
                            <Button variant="solid" form={FORM_ID} loading={saving}>
                                Register business
                            </Button>
                        </div>
                    ),
                }}
            >
                <OrganizationForm id={FORM_ID} onSubmit={onSubmit} />
            </Card>
        </>
    )
}
