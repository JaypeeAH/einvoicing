import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import SetPasswordForm from '@/components/auth/SetPasswordForm'
import Loading from '@/components/shared/Loading'
import { getServerSessionUser } from '@/server/auth/session'
import { signInPath } from '@/configs/app.config'

export const metadata: Metadata = { title: 'Set your password' }

/** Where invitation and password-reset links end up, once the session has been started. */
export default async function SetPasswordPage() {
    const user = await getServerSessionUser()
    if (!user) redirect(`${signInPath}?error=link`)

    return (
        <Suspense fallback={<Loading loading type="default" />}>
            <SetPasswordForm email={user.email} />
        </Suspense>
    )
}
