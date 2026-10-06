'use client'

import Link from 'next/link'
import LinkButton from '@/components/ui/LinkButton'
import Logo from '@/components/template/Logo'
import useTheme from '@/utils/hooks/useTheme'
import { signInPath, signUpPath, welcomePath } from '@/configs/app.config'
import { HEADER_HEIGHT } from '@/constants/theme.constant'

const LINKS = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it works' },
    { href: '#compliance', label: 'BIR compliance' },
    { href: '#faq', label: 'FAQ' },
]

/** Sticky, translucent header of the public homepage. */
export default function LandingHeader() {
    const mode = useTheme((state) => state.mode)
    return (
        <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
            <div
                className="container flex items-center justify-between gap-4 px-4 sm:px-6"
                style={{ height: HEADER_HEIGHT }}
            >
                <Link href={welcomePath} aria-label="Home">
                    <Logo mode={mode} className="hidden sm:flex" />
                    <Logo mode={mode} type="streamline" className="sm:hidden" />
                </Link>
                <nav className="hidden items-center gap-6 text-sm font-semibold lg:flex" aria-label="Sections">
                    {LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-gray-600 transition-colors hover:text-primary dark:text-gray-300"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                    <LinkButton href={signInPath} size="sm" variant="plain">
                        Sign in
                    </LinkButton>
                    <LinkButton href={signUpPath} size="sm" variant="solid">
                        Get started
                    </LinkButton>
                </div>
            </div>
        </header>
    )
}
