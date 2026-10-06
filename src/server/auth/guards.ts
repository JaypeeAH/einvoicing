import 'server-only'

import dayjs from 'dayjs'
import { redirect } from 'next/navigation'
import { getServerSessionUser } from '@/server/auth/session'
import { passwordMaxAgeDays } from '@/server/env'
import { changePasswordPath, onboardingPath, signInPath } from '@/configs/app.config'
import { hasAnyAuthority } from '@/utils/hasAuthority'
import type { Action } from '@/constants/actions.constant'

/** Signed-in user, or redirect to sign in. */
export const requireUser = async () => {
    const user = await getServerSessionUser()
    if (!user) redirect(signInPath)
    return user
}

/** True when the password is older than the CAS rotation period (30 days by default). */
export const isPasswordExpired = (passwordChangedAt: string | null) =>
    passwordMaxAgeDays > 0 &&
    (!passwordChangedAt || dayjs().diff(dayjs(passwordChangedAt), 'day') >= passwordMaxAgeDays)

/**
 * Signed-in member of an organization with a current password. Sends users without an organization to
 * onboarding and users with an expired password to the change-password page.
 */
export const requireMember = async () => {
    const user = await requireUser()
    if (!user.organization || !user.role) redirect(onboardingPath)
    if (isPasswordExpired(user.passwordChangedAt)) redirect(`${changePasswordPath}?expired=1`)
    return user as typeof user & {
        organization: NonNullable<typeof user.organization>
        role: NonNullable<typeof user.role>
    }
}

/** For server pages: true when the member's role allows any of `actions` (render <Forbidden /> otherwise). */
export const canAccessPage = async (...actions: Action[]) => {
    const user = await requireMember()
    return hasAnyAuthority(user.role, actions)
}
