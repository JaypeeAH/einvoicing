'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import Card from '@/components/ui/Card'
import { useDashboardStore } from '@/stores/DashboardStore'
import { useComplianceStore } from '@/stores/ComplianceStore'
import { formatDateOnly, todayInManila } from '@/utils/date'
import classNames from '@/utils/classNames'
import { compliancePath, seriesPath, transmissionsPath } from '@/configs/app.config'
import { EINVOICING_DEADLINE, EIS_TRANSMISSION_DAYS } from '@/constants/bir.constant'
import { ErrorIcon, ForwardIcon, InfoIcon, SuccessIcon, WarningIcon } from '@/configs/icons.config'
import type { ReactNode } from 'react'

interface ActionNeededPanelProps {
    /** Include compliance checklist items and the e-invoicing deadline (roles that can view compliance). */
    showCompliance: boolean
}

interface ActionItem {
    key: string
    tone: 'error' | 'warning' | 'info'
    title: string
    description: ReactNode
    href: string
    linkLabel: string
}

const TONE_CLASS = {
    error: 'bg-error-subtle text-error',
    warning: 'bg-warning-subtle text-warning',
    info: 'bg-info-subtle text-info',
}

const TONE_ICON = {
    error: <ErrorIcon />,
    warning: <WarningIcon />,
    info: <InfoIcon />,
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** Things the business should deal with now: EIS problems, series running low, compliance steps, deadline. */
export default function ActionNeededPanel({ showCompliance }: ActionNeededPanelProps) {
    const summary = useDashboardStore((state) => state.data)
    const dashboardLoading = useDashboardStore((state) => state.loading)
    const compliance = useComplianceStore((state) => state.data)

    const items: ActionItem[] = []

    if (summary) {
        if (summary.transmissions.overdue > 0) {
            items.push({
                key: 'transmissions-overdue',
                tone: 'error',
                title: `${plural(summary.transmissions.overdue, 'invoice')} overdue for EIS transmission`,
                description: `Invoices must reach BIR within ${EIS_TRANSMISSION_DAYS} days of issue. Send them now.`,
                href: transmissionsPath,
                linkLabel: 'View transmissions',
            })
        }
        if (summary.transmissions.rejected > 0) {
            items.push({
                key: 'transmissions-rejected',
                tone: 'error',
                title: `${plural(summary.transmissions.rejected, 'invoice')} rejected by BIR`,
                description: 'Check the BIR response message, fix the problem and retry.',
                href: transmissionsPath,
                linkLabel: 'Review',
            })
        }
        summary.seriesWarnings.forEach((warning) => {
            items.push({
                key: `series-${warning.seriesId}`,
                tone: 'warning',
                title: `${warning.label} is running low`,
                description: `Only ${plural(warning.remaining, 'serial number')} left. Register the next series before it runs out.`,
                href: seriesPath,
                linkLabel: 'Invoice series',
            })
        })
    }

    if (showCompliance && compliance) {
        if (compliance.assessment?.result.status === 'required') {
            const daysLeft = dayjs(EINVOICING_DEADLINE).diff(dayjs(todayInManila()), 'day')
            items.push({
                key: 'deadline',
                tone: daysLeft <= 90 ? 'error' : 'warning',
                title: `E-invoicing deadline: ${formatDateOnly(EINVOICING_DEADLINE)}`,
                description:
                    daysLeft >= 0
                        ? `${plural(daysLeft, 'day')} left. You are required to issue electronic invoices by this date.`
                        : 'The deadline has passed. Complete your PTI and EIS certification as soon as possible.',
                href: compliancePath,
                linkLabel: 'Compliance Center',
            })
        }
        compliance.checklist
            .filter((item) => item.state === 'action')
            .slice(0, 3)
            .forEach((item) => {
                items.push({
                    key: `checklist-${item.key}`,
                    tone: 'info',
                    title: item.title,
                    description: item.description,
                    href: item.href ?? compliancePath,
                    linkLabel: 'Open',
                })
            })
    }

    return (
        <Card header={{ content: 'Action needed' }} className="h-full">
            {!summary && dashboardLoading ? (
                <p className="text-gray-500">Checking what needs your attention…</p>
            ) : items.length === 0 ? (
                <div className="flex items-center gap-3 py-2">
                    <span className="text-3xl text-success">
                        <SuccessIcon />
                    </span>
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">You’re all caught up</div>
                        <div className="text-sm text-gray-500">Nothing needs your attention right now.</div>
                    </div>
                </div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {items.map((item) => (
                        <li key={item.key} className="flex gap-3">
                            <span
                                className={classNames(
                                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl',
                                    TONE_CLASS[item.tone],
                                )}
                            >
                                {TONE_ICON[item.tone]}
                            </span>
                            <div className="min-w-0 flex-auto">
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</div>
                                <div className="text-sm text-gray-500">{item.description}</div>
                                <Link
                                    href={item.href}
                                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                                >
                                    {item.linkLabel}
                                    <ForwardIcon />
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}
