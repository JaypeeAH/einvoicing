'use client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import StatusBadge from '@/components/shared/StatusBadge'
import { useComplianceStore } from '@/stores/ComplianceStore'
import { formatDateOnly, formatDateTime } from '@/utils/date'
import { COVERAGE_STATUS_OPTIONS } from '@/@types/compliance/CoverageStatusOptions'
import { ChecklistIcon, DueDateIcon, RefreshIcon } from '@/configs/icons.config'

interface CoverageCardProps {
    /** Show the "Check again" button (users who can manage compliance). */
    canManage: boolean
    onCheck: () => void
}

/** The latest "Do I need to e-invoice?" result: headline, reasons, deadline and references. */
export default function CoverageCard({ canManage, onCheck }: CoverageCardProps) {
    const status = useComplianceStore((state) => state.data)
    const loading = useComplianceStore((state) => state.loading)
    const assessment = status?.assessment

    return (
        <Card header={{ content: 'Do I need to e-invoice?' }}>
            {!status && loading ? (
                <div className="flex flex-col gap-3">
                    <Skeleton height={20} />
                    <Skeleton height={60} />
                </div>
            ) : !assessment ? (
                <div className="flex flex-col items-start gap-3">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <ChecklistIcon className="text-2xl text-primary" />
                        <span className="font-semibold">Find out in about a minute</span>
                    </div>
                    <p className="text-gray-500">
                        Answer a few questions about your business to see whether the e-invoicing deadline applies to
                        you.
                    </p>
                    {canManage ? (
                        <Button size="sm" variant="solid" onClick={onCheck}>
                            Check now
                        </Button>
                    ) : (
                        <p className="text-sm text-gray-500">
                            Ask an owner, administrator or accountant to answer the questions.
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div>
                        <StatusBadge option={COVERAGE_STATUS_OPTIONS[assessment.result.status]} />
                        <div className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                            {assessment.result.headline}
                        </div>
                    </div>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
                        {assessment.result.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                        ))}
                    </ul>
                    {assessment.result.deadline && (
                        <div className="flex items-center gap-2 rounded-lg bg-warning-subtle px-3 py-2 text-sm font-semibold text-warning">
                            <DueDateIcon className="text-lg" />
                            Deadline: {formatDateOnly(assessment.result.deadline)}
                        </div>
                    )}
                    {assessment.result.references.length > 0 && (
                        <div className="text-xs text-gray-500">Based on {assessment.result.references.join(', ')}</div>
                    )}
                    <div className="text-xs text-gray-400">
                        Answered {assessment.assessedByName ? `by ${assessment.assessedByName} ` : ''}on{' '}
                        {formatDateTime(assessment.createdAt)}
                    </div>
                    {canManage && (
                        <div>
                            <Button size="sm" icon={<RefreshIcon />} onClick={onCheck}>
                                Check again
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}
