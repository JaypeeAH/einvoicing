'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LinkButton from '@/components/ui/LinkButton'
import Tag from '@/components/ui/Tag'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import { useSessionStore } from '@/stores/SessionStore'
import { getBrowserSupabase } from '@/services/supabase/browser'
import { formatDate } from '@/utils/date'
import { changePasswordPath, onboardingPath, signInPath } from '@/configs/app.config'
import { PASSWORD_MAX_AGE_DAYS, VAT_REGISTRATION_LABELS } from '@/constants/bir.constant'
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/constants/roles.constant'
import { AddIcon, CompanyNavIcon, PasswordIcon, SignOutIcon } from '@/configs/icons.config'
import type { ReactNode } from 'react'

interface DetailRowProps {
    label: string
    children: ReactNode
}

/** One label/value line in the profile card. */
function DetailRow({ label, children }: DetailRowProps) {
    return (
        <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="w-48 shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</div>
            <div className="min-w-0 text-gray-900 dark:text-gray-100">{children}</div>
        </div>
    )
}

/** The signed-in user's profile, password status and the businesses they belong to. */
export default function AccountClientPage() {
    const user = useSessionStore((state) => state.user)
    const [signingOut, setSigningOut] = useState(false)

    if (!user) return null

    const passwordAge = user.passwordChangedAt ? dayjs().diff(dayjs(user.passwordChangedAt), 'day') : null
    const passwordDue = passwordAge === null || passwordAge >= PASSWORD_MAX_AGE_DAYS

    const signOut = async () => {
        setSigningOut(true)
        await getBrowserSupabase().auth.signOut()
        window.location.assign(signInPath)
    }

    return (
        <>
            <PageHeader
                title="My account"
                description="Your sign-in details and the businesses you can work in."
                actions={
                    <Button size="sm" icon={<SignOutIcon />} loading={signingOut} onClick={signOut}>
                        Sign out
                    </Button>
                }
            />
            <div className="flex flex-col gap-4">
                <Card header={{ content: 'Profile' }}>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        <DetailRow label="Name">{user.fullName || '—'}</DetailRow>
                        <DetailRow label="Email">{user.email}</DetailRow>
                        <DetailRow label="Password">
                            <div className="flex flex-wrap items-center gap-3">
                                <span>
                                    {user.passwordChangedAt
                                        ? `Last changed ${formatDate(user.passwordChangedAt)}`
                                        : 'Not changed since you joined'}
                                </span>
                                {passwordDue && (
                                    <Tag className="border-0 bg-warning-subtle text-warning">Due for a change</Tag>
                                )}
                                <LinkButton size="xs" href={changePasswordPath} icon={<PasswordIcon />}>
                                    Change password
                                </LinkButton>
                            </div>
                        </DetailRow>
                    </div>
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        BIR’s CAS security standard asks everyone to change their password every {PASSWORD_MAX_AGE_DAYS}{' '}
                        days. We’ll remind you when it’s time.
                    </p>
                </Card>

                <Card
                    header={{
                        content: 'Your businesses',
                        extra: user.memberships.length > 0 && (
                            <LinkButton size="xs" href={onboardingPath} icon={<AddIcon />}>
                                Register another business
                            </LinkButton>
                        ),
                    }}
                >
                    {user.memberships.length === 0 ? (
                        <EmptyState
                            icon={<CompanyNavIcon />}
                            title="You haven’t registered a business yet"
                            description="Register your business to start issuing invoices, or ask your employer to invite you."
                            action={
                                <LinkButton size="sm" variant="solid" href={onboardingPath} icon={<AddIcon />}>
                                    Register your business
                                </LinkButton>
                            }
                        />
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {user.memberships.map(({ organization, role }) => (
                                <li
                                    key={organization.id}
                                    className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-6"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                {organization.registeredName}
                                            </span>
                                            {organization.id === user.organization?.id && (
                                                <Tag className="border-0 bg-primary-subtle text-primary">Current</Tag>
                                            )}
                                        </div>
                                        {organization.businessName && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {organization.businessName}
                                            </div>
                                        )}
                                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            TIN {organization.tin} ·{' '}
                                            {VAT_REGISTRATION_LABELS[organization.vatRegistration]}
                                        </div>
                                    </div>
                                    <div className="md:max-w-sm md:text-right">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                                            {ROLE_LABELS[role]}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {ROLE_DESCRIPTIONS[role]}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </>
    )
}
