import type { Metadata } from 'next'
import SignUpForm from '@/components/auth/SignUpForm'

export const metadata: Metadata = { title: 'Create an account' }

export default function SignUpPage() {
    return (
        <>
            <h3 className="heading-text mb-1">Create your account</h3>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
                Start with your own sign-in. You’ll register your business details in the next step.
            </p>
            <SignUpForm />
        </>
    )
}
