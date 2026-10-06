'use client'

import Tag from '@/components/ui/Tag'
import Reveal from '@/components/landing/Reveal'
import SectionHeading from '@/components/landing/SectionHeading'
import { REGULATORY_REFERENCES } from '@/constants/bir.constant'
import { InfoIcon } from '@/configs/icons.config'

/** The regulations the product follows, and an honest note on BIR accreditation. */
export default function ComplianceSection() {
    return (
        <section id="compliance" className="scroll-mt-20 bg-white py-20 sm:py-28 dark:bg-gray-900">
            <div className="container px-4 sm:px-6">
                <SectionHeading
                    eyebrow="BIR compliance"
                    title="Designed around the current rules"
                    description="Every invoice rule in the app cites the regulation behind it, and is updated when BIR issues new guidance."
                />
                <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {REGULATORY_REFERENCES.map((reference, index) => (
                        <Reveal key={reference.code} delay={(index % 3) * 0.08}>
                            <div className="h-full rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
                                <Tag className="border-0 bg-primary-subtle text-primary">{reference.code}</Tag>
                                <div className="mt-3 font-bold text-gray-900 dark:text-gray-100">{reference.title}</div>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{reference.summary}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
                <Reveal className="mx-auto mt-10 max-w-3xl">
                    <div className="flex gap-3 rounded-2xl bg-info-subtle p-5 text-sm text-gray-700 dark:text-gray-200">
                        <InfoIcon className="mt-0.5 shrink-0 text-xl text-info" />
                        <p>
                            <strong>A note on “BIR accreditation”:</strong> BIR does not accredit invoicing software or
                            providers. You, as the taxpayer, register the system with your RDO (Acknowledgment
                            Certificate), get your Permit to Issue e-invoices and complete EIS certification. This app
                            prints what BIR requires and walks you through each of those steps.
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    )
}
