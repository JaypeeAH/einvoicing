'use client'

import Link from 'next/link'
import Logo from '@/components/template/Logo'
import UserDropdown from '@/components/template/UserDropdown'
import EnvironmentBanner from '@/components/template/EnvironmentBanner'
import Footer from '@/components/template/Footer'
import useTheme from '@/utils/hooks/useTheme'
import { homePath } from '@/configs/app.config'
import { HEADER_HEIGHT } from '@/constants/theme.constant'
import type { ProviderProps } from '@/@types/common'

/** Minimal shell (logo + user menu) for onboarding and account pages. */
export default function SimpleLayout({ children }: ProviderProps) {
    const mode = useTheme((state) => state.mode)
    return (
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
            <EnvironmentBanner />
            <header
                className="flex items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-gray-700 dark:bg-gray-800"
                style={{ height: HEADER_HEIGHT }}
            >
                <Link href={homePath}>
                    <Logo mode={mode} />
                </Link>
                <UserDropdown />
            </header>
            <main className="mx-auto w-full max-w-4xl flex-auto px-4 py-8 sm:px-6">{children}</main>
            <Footer pageContainerType="gutterless" />
        </div>
    )
}
