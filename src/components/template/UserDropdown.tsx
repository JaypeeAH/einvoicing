'use client'

import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import { useSessionStore } from '@/stores/SessionStore'
import { getBrowserSupabase } from '@/services/supabase/browser'
import useTheme from '@/utils/hooks/useTheme'
import { accountPath, changePasswordPath, signInPath } from '@/configs/app.config'
import { AccountIcon, DarkModeIcon, LightModeIcon, PasswordIcon, SignOutIcon } from '@/configs/icons.config'
import { ROLE_LABELS } from '@/constants/roles.constant'

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || '?'

/** Signed-in user menu: profile, password, light/dark mode and sign out. */
export default function UserDropdown() {
    const user = useSessionStore((state) => state.user)
    const mode = useTheme((state) => state.mode)
    const setMode = useTheme((state) => state.setMode)

    if (!user) return null

    const signOut = async () => {
        await getBrowserSupabase().auth.signOut()
        window.location.assign(signInPath)
    }

    return (
        <Dropdown
            placement="bottom-end"
            renderTitle={
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <Avatar size={36} shape="circle" className="bg-primary-subtle text-primary font-semibold">
                        {initials(user.fullName || user.email)}
                    </Avatar>
                </button>
            }
        >
            <Dropdown.Item variant="header">
                <div className="px-3 py-2">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{user.fullName || user.email}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    {user.role && (
                        <div className="mt-1 text-xs font-semibold text-primary">{ROLE_LABELS[user.role]}</div>
                    )}
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            <Dropdown.Item eventKey="account" className="px-0">
                <Link href={accountPath} className="flex h-full w-full items-center gap-2 px-3">
                    <AccountIcon className="text-lg" /> My account
                </Link>
            </Dropdown.Item>
            <Dropdown.Item eventKey="password" className="px-0">
                <Link href={changePasswordPath} className="flex h-full w-full items-center gap-2 px-3">
                    <PasswordIcon className="text-lg" /> Change password
                </Link>
            </Dropdown.Item>
            <Dropdown.Item eventKey="mode" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
                <span className="flex items-center gap-2">
                    {mode === 'dark' ? <LightModeIcon className="text-lg" /> : <DarkModeIcon className="text-lg" />}
                    {mode === 'dark' ? 'Light mode' : 'Dark mode'}
                </span>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            <Dropdown.Item eventKey="sign-out" onClick={signOut}>
                <span className="flex items-center gap-2 text-error">
                    <SignOutIcon className="text-lg" /> Sign out
                </span>
            </Dropdown.Item>
        </Dropdown>
    )
}
