'use client'

import LinkButton from '@/components/ui/LinkButton'
import Reveal from '@/components/landing/Reveal'
import { signInPath, signUpPath } from '@/configs/app.config'
import { ForwardIcon } from '@/configs/icons.config'

/** Closing banner inviting the visitor to sign up. */
export default function CallToActionSection() {
    return (
        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
            <Reveal className="container">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-deep px-6 py-14 text-center shadow-xl shadow-primary/20 sm:px-12">
                    <div
                        aria-hidden
                        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
                    />
                    <div
                        aria-hidden
                        className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
                    />
                    <h2 className="relative text-3xl font-extrabold text-white sm:text-4xl">
                        Get ready before December 31, 2026
                    </h2>
                    <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/85">
                        Set up your business, invoice series and BIR registrations today — your first invoice is a few
                        minutes away.
                    </p>
                    <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                        <LinkButton
                            href={signUpPath}
                            icon={<ForwardIcon />}
                            iconAlignment="end"
                            className="border-white bg-white text-primary hover:text-primary-deep"
                        >
                            Create your account
                        </LinkButton>
                        <LinkButton href={signInPath} variant="plain" className="text-white hover:text-white/80">
                            Sign in
                        </LinkButton>
                    </div>
                </div>
            </Reveal>
        </section>
    )
}
