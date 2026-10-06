'use client'

import { createContext, useContext } from 'react'
import type { SessionUser } from '@/@types/auth/SessionUser'

interface SessionState {
    user: SessionUser | null
}

/** Holds the user resolved on the server; provided by SessionProvider (no store updates during render). */
export const SessionContext = createContext<SessionState>({ user: null })

/** Reads the session through a selector: `useSessionStore((state) => state.user?.role)`. */
export const useSessionStore = <T>(selector: (state: SessionState) => T): T => selector(useContext(SessionContext))
