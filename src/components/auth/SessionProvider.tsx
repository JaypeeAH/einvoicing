'use client'

import { useMemo } from 'react'
import { SessionContext } from '@/stores/SessionStore'
import type { ProviderProps } from '@/@types/common'
import type { SessionUser } from '@/@types/auth/SessionUser'

interface SessionProviderProps extends ProviderProps {
    user: SessionUser
}

/** Makes the user resolved on the server available to client components (navigation, permissions). */
export default function SessionProvider({ user, children }: SessionProviderProps) {
    const value = useMemo(() => ({ user }), [user])
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
