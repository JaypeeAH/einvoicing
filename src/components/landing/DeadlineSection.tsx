'use client'

import dayjs from 'dayjs'
import Reveal from '@/components/landing/Reveal'
import { todayInManila } from '@/utils/date'
import {
    EINVOICING_DEADLINE,
    EIS_CERTIFICATION_MONTHS_AFTER_PTI,
    EIS_TRANSMISSION_DAYS,
    RECORD_RETENTION_YEARS,
} from '@/constants/bir.constant'

/** Key e-invoicing numbers, with a live count of days left before the deadline. */
export default function DeadlineSection() {
    const daysLeft = Math.max(dayjs(EINVOICING_DEADLINE).diff(dayjs(todayInManila()), 'day'), 0)

    const stats = [
        {
            value: daysLeft.toLocaleString('en-PH'),
            label: 'days left to start issuing e-invoices',
            tone: 'text-primary',
        },
        { value: `${EIS_CERTIFICATION_MONTHS_AFTER_PTI} months`, label: 'to pass EIS certification after your PTI' },
        { value: `${EIS_TRANSMISSION_DAYS} days`, label: 'to transmit each invoice once you hold a PTT' },
        { value: `${RECORD_RETENTION_YEARS} years`, label: 'that invoices and books must be kept' },
    ]

    return (
        <section className="border-y border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="container grid grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Reveal key={stat.label} delay={index * 0.08} className="text-center lg:text-left">
                        <div className={`text-3xl font-extrabold sm:text-4xl ${stat.tone ?? 'heading-text'}`}>
                            {stat.value}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                    </Reveal>
                ))}
            </div>
            <p className="container px-4 pb-6 text-center text-xs text-gray-400 sm:px-6 lg:text-left">
                Applies to small, medium and large taxpayers that sell online, use invoicing software or are under the
                Large Taxpayers Service. Micro taxpayers are exempt (RR 26-2025, RMC 98-2026).
            </p>
        </section>
    )
}
