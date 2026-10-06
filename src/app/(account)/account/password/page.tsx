import type { Metadata } from 'next'
import { Suspense } from 'react'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import ChangePasswordForm from '@/components/account/ChangePasswordForm'

export const metadata: Metadata = { title: 'Change password' }

export default function ChangePasswordPage() {
    return (
        <div className="mx-auto w-full max-w-lg">
            <PageHeader
                title="Change password"
                description="Choose a new password that’s different from your current one. You’ll stay signed in on this device."
            />
            <Card>
                <Suspense>
                    <ChangePasswordForm />
                </Suspense>
            </Card>
        </div>
    )
}
