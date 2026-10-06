'use client'

import Card from '@/components/ui/Card'
import Progress from '@/components/ui/Progress'
import LinkButton from '@/components/ui/LinkButton'
import Skeleton from '@/components/ui/Skeleton'
import { useComplianceStore } from '@/stores/ComplianceStore'
import classNames from '@/utils/classNames'
import { SuccessIcon, TimeIcon, VoidIcon, WarningIcon } from '@/configs/icons.config'
import type { ChecklistItem, ChecklistState } from '@/@types/compliance/ComplianceStatus'
import type { ReactNode } from 'react'

const STATE_INFO: Record<ChecklistState, { label: string; icon: ReactNode; className: string }> = {
    done: { label: 'Done', icon: <SuccessIcon />, className: 'bg-success-subtle text-success' },
    action: { label: 'To do', icon: <WarningIcon />, className: 'bg-warning-subtle text-warning' },
    pending: { label: 'Waiting', icon: <TimeIcon />, className: 'bg-info-subtle text-info' },
    not_applicable: {
        label: 'Not applicable',
        icon: <VoidIcon />,
        className: 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400',
    },
}

const scoreColor = (score: number) => (score >= 80 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-error')

/** Readiness score and the step-by-step compliance checklist. */
export default function ReadinessCard() {
    const status = useComplianceStore((state) => state.data)
    const loading = useComplianceStore((state) => state.loading)

    const applicable = status?.checklist.filter((item) => item.state !== 'not_applicable') ?? []
    const done = applicable.filter((item) => item.state === 'done').length

    return (
        <Card header={{ content: 'Your readiness' }}>
            {!status ? (
                loading && (
                    <div className="flex flex-col gap-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} height={40} />
                        ))}
                    </div>
                )
            ) : (
                <>
                    <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
                        <Progress
                            variant="circle"
                            percent={status.score}
                            width={110}
                            customColorClass={scoreColor(status.score)}
                        />
                        <div className="text-center sm:text-left">
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {done} of {applicable.length} steps done
                            </div>
                            <p className="text-gray-500">
                                {status.score === 100
                                    ? 'Great work — every step that applies to you is complete.'
                                    : 'Work through the steps below in order. Each one links to the page where you can complete it.'}
                            </p>
                        </div>
                    </div>
                    <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
                        {status.checklist.map((item) => (
                            <ChecklistRow key={item.key} item={item} />
                        ))}
                    </ul>
                </>
            )}
        </Card>
    )
}

interface ChecklistRowProps {
    item: ChecklistItem
}

/** One checklist step: state icon, title, description, legal reference and a link to act on it. */
function ChecklistRow({ item }: ChecklistRowProps) {
    const info = STATE_INFO[item.state]
    const muted = item.state === 'not_applicable'

    return (
        <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-auto gap-3">
                <span
                    className={classNames(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl',
                        info.className,
                    )}
                    title={info.label}
                    aria-label={info.label}
                >
                    {info.icon}
                </span>
                <div className="min-w-0">
                    <div
                        className={classNames(
                            'font-semibold',
                            muted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100',
                        )}
                    >
                        {item.title}
                    </div>
                    <div
                        className={classNames('text-sm', muted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500')}
                    >
                        {item.description}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-400">
                        <span>{info.label}</span>
                        {item.reference && <span>{item.reference}</span>}
                    </div>
                </div>
            </div>
            {item.href && item.state !== 'done' && !muted && (
                <LinkButton size="xs" href={item.href} className="shrink-0 self-start sm:ml-auto">
                    {item.state === 'pending' ? 'View' : 'Do this'}
                </LinkButton>
            )}
            {item.href && item.state === 'done' && (
                <LinkButton size="xs" variant="plain" href={item.href} className="shrink-0 self-start sm:ml-auto">
                    View
                </LinkButton>
            )}
        </li>
    )
}
