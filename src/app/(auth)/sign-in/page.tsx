import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignInForm from '@/components/auth/SignInForm'

export const metadata: Metadata = { title: 'Sign in' }

export default function SignInPage() {
    return (
        <>
            <h3 className="heading-text mb-1">Sign in</h3>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
                Welcome back. Sign in to issue invoices and keep your BIR records in order.
            </p>
            <Suspense>
                <SignInForm />
            </Suspense>
        </>
    )
}
