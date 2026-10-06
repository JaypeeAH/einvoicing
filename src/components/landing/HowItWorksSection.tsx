'use client'

import Reveal from '@/components/landing/Reveal'
import SectionHeading from '@/components/landing/SectionHeading'

const STEPS = [
    {
        title: 'Register your business',
        description:
            'Enter your details exactly as on your BIR Certificate of Registration (Form 2303) and add your branches.',
    },
    {
        title: 'Set up your invoice series',
        description:
            'Add the serial ranges and Acknowledgment Certificate number from your CAS registration, per branch and document type.',
    },
    {
        title: 'Issue invoices',
        description:
            'Pick a customer and items — VAT, discounts and totals are computed for you. Issue, print or save as PDF.',
    },
    {
        title: 'Stay compliant',
        description:
            'Run your Sales Journal and Summary List of Sales, track your PTI and EIS certification, and transmit to BIR.',
    },
]

/** Four-step onboarding path. */
export default function HowItWorksSection() {
    return (
        <section id="how-it-works" className="scroll-mt-20 bg-white py-20 sm:py-28 dark:bg-gray-900">
            <div className="container px-4 sm:px-6">
                <SectionHeading
                    eyebrow="How it works"
                    title="From sign-up to your first invoice in minutes"
                    description="The dashboard guides you through each step and tells you what is still missing."
                />
                <div className="relative mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div
                        aria-hidden
                        className="absolute top-6 right-[12%] left-[12%] hidden h-0.5 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 lg:block"
                    />
                    {STEPS.map((step, index) => (
                        <Reveal key={step.title} delay={index * 0.1}>
                            <div className="relative text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-neutral shadow-lg shadow-primary/30">
                                    {index + 1}
                                </div>
                                <h5 className="mt-5">{step.title}</h5>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">{step.description}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
