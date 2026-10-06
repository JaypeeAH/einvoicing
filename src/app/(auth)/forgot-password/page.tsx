import type { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = { title: 'Reset your password' }

export default function ForgotPasswordPage() {
    return (
        <>
            <h3 className="heading-text mb-1">Reset your password</h3>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
                Enter the email you sign in with and we’ll send you a link to choose a new password.
            </p>
            <ForgotPasswordForm />
        </>
    )
}
