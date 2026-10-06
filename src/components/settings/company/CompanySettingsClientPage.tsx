'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Skeleton from '@/components/ui/Skeleton'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import OrganizationForm from '@/components/organization/forms/OrganizationForm'
import EisTransmissionField from '@/components/settings/company/EisTransmissionField'
import { useOrganizationStore } from '@/stores/OrganizationStore'
import { apiUpdateOrganization } from '@/services/organization'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { SaveIcon } from '@/configs/icons.config'
import type { OrganizationSettingsFormData } from '@/@types/organizations/forms/OrganizationFormData'

const FORM_ID = 'company-settings-form'

/** Company profile (taxpayer details printed on invoices) and the EIS transmission switch. */
export default function CompanySettingsClientPage() {
    useSetBreadcrumbs([{ label: 'Administration' }, { label: 'Company Profile' }])

    const router = useRouter()
    const organization = useOrganizationStore((state) => state.data)
    const loading = useOrganizationStore((state) => state.loading)
    const error = useOrganizationStore((state) => state.error)
    const refresh = useOrganizationStore((state) => state.refresh)
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: OrganizationSettingsFormData) => {
        setSaving(true)
        try {
            await apiUpdateOrganization(data)
            toastSuccess('Company profile saved.')
            refresh()
            // Re-reads the session so the header and organization switcher show the new name
            router.refresh()
        } catch (saveError) {
            toastError('Could not save the company profile.', saveError)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <PageHeader
                title="Company profile"
                description="Your business details as registered with the BIR. They are printed on every invoice you issue."
                actions={
                    organization && (
                        <Button size="sm" variant="solid" icon={<SaveIcon />} form={FORM_ID} loading={saving}>
                            Save changes
                        </Button>
                    )
                }
            />
            <Alert type="info" showIcon duration={0} className="mb-4">
                <span className="font-normal">
                    Changes apply to documents issued from now on; issued invoices keep the details they were issued
                    with.
                </span>
            </Alert>
            {error && !organization && (
                <Alert type="danger" showIcon duration={0} className="mb-4">
                    {error}
                </Alert>
            )}
            <Card
                footer={
                    organization
                        ? {
                              content: (
                                  <div className="flex justify-end">
                                      <Button variant="solid" icon={<SaveIcon />} form={FORM_ID} loading={saving}>
                                          Save changes
                                      </Button>
                                  </div>
                              ),
                          }
                        : undefined
                }
            >
                {organization ? (
                    <OrganizationForm
                        key={organization.id}
                        id={FORM_ID}
                        organization={organization}
                        onSubmit={onSubmit}
                    >
                        <EisTransmissionField />
                    </OrganizationForm>
                ) : (
                    loading && (
                        <div className="flex flex-col gap-6">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="flex flex-col gap-2">
                                    <Skeleton height={12} width={140} />
                                    <Skeleton height={40} />
                                </div>
                            ))}
                        </div>
                    )
                )}
            </Card>
        </>
    )
}
