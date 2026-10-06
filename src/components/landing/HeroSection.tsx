'use client'

import LinkButton from '@/components/ui/LinkButton'
import Reveal from '@/components/landing/Reveal'
import InvoiceMockup from '@/components/landing/InvoiceMockup'
import { signInPath, signUpPath } from '@/configs/app.config'
import { DueDateIcon, ForwardIcon, SuccessIcon } from '@/configs/icons.config'

const HIGHLIGHTS = ['VAT and non-VAT businesses', 'Head office and branches', 'Senior citizen & PWD discounts built in']

/** First screen: what the product is, the deadline, and the two main actions. */
export default function HeroSection() {
    return (
        <section className="relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute top-20 -right-40 h-[32rem] w-[32rem] rounded-full bg-info/15 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--gray-300)_1px,transparent_0)] [background-size:28px_28px] opacity-40 dark:opacity-10" />
            </div>

            <div className="container grid items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
                <Reveal>
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
                        <DueDateIcon className="text-base" />
                        E-invoicing deadline: December 31, 2026 (RR 26-2025)
                    </span>
                    <h1 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                        BIR-ready invoicing for{' '}
                        <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                            Philippine small businesses
                        </span>
                    </h1>
                    <p className="mt-5 max-w-xl text-lg text-gray-600 dark:text-gray-300">
                        Issue sales invoices, credit and debit memos with every detail BIR requires — then keep your
                        books, permits and e-invoice transmissions in order, all in one place.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <LinkButton href={signUpPath} variant="solid" icon={<ForwardIcon />} iconAlignment="end">
                            Create your account
                        </LinkButton>
                        <LinkButton href={signInPath}>I already have an account</LinkButton>
                    </div>
                    <ul className="mt-8 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-x-6 dark:text-gray-300">
                        {HIGHLIGHTS.map((item) => (
                            <li key={item} className="flex items-center gap-2">
                                <SuccessIcon className="shrink-0 text-lg text-success" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </Reveal>
                <Reveal delay={0.15}>
                    <InvoiceMockup />
                </Reveal>
            </div>
        </section>
    )
}
