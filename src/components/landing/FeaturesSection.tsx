'use client'

import Card from '@/components/ui/Card'
import Reveal from '@/components/landing/Reveal'
import SectionHeading from '@/components/landing/SectionHeading'
import {
    BranchIcon,
    ChecklistIcon,
    CreditMemoIcon,
    InvoiceIcon,
    LockedIcon,
    PersonIcon,
    SendIcon,
    SpreadsheetIcon,
    VersionHistoryIcon,
} from '@/configs/icons.config'
import type { IconType } from 'react-icons'

const FEATURES: { icon: IconType; title: string; description: string }[] = [
    {
        icon: InvoiceIcon,
        title: 'Invoices BIR expects',
        description:
            'VAT REG TIN with branch code, buyer details, VATable / exempt / zero-rated breakdown and your Acknowledgment Certificate on every invoice.',
    },
    {
        icon: LockedIcon,
        title: 'Locked once issued',
        description:
            'Serial numbers are assigned in order, with no gaps, per branch. Issued invoices cannot be edited or deleted — only voided with a reason.',
    },
    {
        icon: CreditMemoIcon,
        title: 'Credit & debit memos',
        description:
            'Fix mistakes the right way: memos reference the original invoice and are marked not valid for input tax.',
    },
    {
        icon: PersonIcon,
        title: 'Senior citizen & PWD discounts',
        description:
            'The 20% (or 10% for solo parents) is computed on the VAT-exclusive price, with the ID details printed for signature.',
    },
    {
        icon: SpreadsheetIcon,
        title: 'Reports in one click',
        description: 'Sales Journal and quarterly Summary List of Sales, exported to CSV with your taxpayer details.',
    },
    {
        icon: SendIcon,
        title: 'EIS transmission ready',
        description:
            'Once BIR issues your Permit to Transmit, invoices are queued, signed and sent to the BIR EIS — with retries and deadlines tracked.',
    },
    {
        icon: ChecklistIcon,
        title: 'Compliance checklist',
        description:
            'Find out if the deadline applies to you, then track your COR, CAS registration, PTI and EIS certification.',
    },
    {
        icon: VersionHistoryIcon,
        title: 'Complete audit trail',
        description: 'Every change records who, when and what changed. The trail cannot be edited or deleted.',
    },
    {
        icon: BranchIcon,
        title: 'Branches & teams',
        description:
            'Separate series per branch, five roles from Owner to Viewer, and one login for every business you manage.',
    },
]

/** What the product does, as a grid of feature cards. */
export default function FeaturesSection() {
    return (
        <section id="features" className="scroll-mt-20 py-20 sm:py-28">
            <div className="container px-4 sm:px-6">
                <SectionHeading
                    eyebrow="Features"
                    title="Everything you need to invoice the BIR way"
                    description="Built around the EOPT Act and BIR's computerized-system rules, so you can focus on selling."
                />
                <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((feature, index) => (
                        <Reveal key={feature.title} delay={(index % 3) * 0.08}>
                            <Card className="group h-full transition-shadow hover:shadow-lg" bodyClass="p-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-subtle text-2xl text-primary transition-transform group-hover:scale-110">
                                    <feature.icon />
                                </div>
                                <h5 className="mt-4">{feature.title}</h5>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">{feature.description}</p>
                            </Card>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
