'use client'

import Reveal from '@/components/landing/Reveal'
import SectionHeading from '@/components/landing/SectionHeading'
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/constants/roles.constant'

/** The five roles, so owners can see how to split work across their team. */
export default function RolesSection() {
    return (
        <section className="py-20 sm:py-28">
            <div className="container px-4 sm:px-6">
                <SectionHeading
                    eyebrow="For your whole team"
                    title="The right access for every person"
                    description="Each person signs in with their own account, so every invoice shows who created it."
                />
                <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {ROLES.map((role, index) => (
                        <Reveal key={role} delay={index * 0.06}>
                            <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                                <div className="font-bold text-gray-900 dark:text-gray-100">{ROLE_LABELS[role]}</div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    {ROLE_DESCRIPTIONS[role]}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
