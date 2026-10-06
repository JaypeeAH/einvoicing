'use client'

import { useState } from 'react'
import Alert from '@/components/ui/Alert'
import PageHeader from '@/components/shared/PageHeader'
import ReadinessCard from '@/components/compliance/ReadinessCard'
import CoverageCard from '@/components/compliance/CoverageCard'
import RegulationsCard from '@/components/compliance/RegulationsCard'
import CoverageDialog from '@/components/compliance/dialogs/CoverageDialog'
import { useComplianceStore } from '@/stores/ComplianceStore'
import { useOrganizationStore } from '@/stores/OrganizationStore'
import useAuthority from '@/utils/hooks/useAuthority'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { ACTION_COMPLIANCE_MANAGE } from '@/constants/actions.constant'

/** Compliance Center: readiness checklist, e-invoicing coverage check and the regulations behind them. */
export default function ComplianceClientPage() {
    useSetBreadcrumbs([{ label: 'BIR Compliance' }, { label: 'Compliance Center' }])

    const status = useComplianceStore((state) => state.data)
    const error = useComplianceStore((state) => state.error)
    const refresh = useComplianceStore((state) => state.refresh)
    const taxpayerSize = useOrganizationStore((state) => state.data?.taxpayerSize)
    const canManage = useAuthority(ACTION_COMPLIANCE_MANAGE)
    const [checking, setChecking] = useState(false)

    return (
        <>
            <PageHeader
                title="Compliance Center"
                description="Your step-by-step guide to issuing BIR-compliant invoices and getting ready for e-invoicing."
            />
            {error && (
                <Alert type="danger" showIcon className="mb-4" duration={0}>
                    {error}
                </Alert>
            )}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ReadinessCard />
                </div>
                <div className="flex flex-col gap-4">
                    <CoverageCard canManage={canManage} onCheck={() => setChecking(true)} />
                    <RegulationsCard />
                </div>
            </div>
            <Alert type="info" showIcon className="mt-4" duration={0}>
                BIR does not accredit invoicing software. Your Acknowledgment Certificate, PTI and EIS certification are
                issued to you as the taxpayer. This checklist is guidance — confirm requirements with your RDO.
            </Alert>

            <CoverageDialog
                isOpen={checking}
                answers={status?.assessment?.answers}
                defaultTaxpayerSize={taxpayerSize}
                onClose={() => setChecking(false)}
                onSaved={() => {
                    setChecking(false)
                    refresh()
                }}
            />
        </>
    )
}
