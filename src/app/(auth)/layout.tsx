import Link from 'next/link'
import Logo from '@/components/template/Logo'
import EnvironmentBanner from '@/components/template/EnvironmentBanner'
import { homePath, portalDescription } from '@/configs/app.config'

/** Centered card layout for sign in, sign up and password recovery. */
export default function AuthLayout({ children }: LayoutProps<'/'>) {
    return (
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
            <EnvironmentBanner />
            <div className="flex flex-auto items-center justify-center px-4 py-10">
                <div className="w-full max-w-md">
                    <div className="mb-8 flex flex-col items-center gap-3 text-center">
                        <Link href={homePath} aria-label="Home">
                            <Logo />
                        </Link>
                        <p className="text-gray-500">{portalDescription}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
