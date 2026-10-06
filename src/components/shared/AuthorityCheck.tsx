'use client'

import useAuthority from '@/utils/hooks/useAuthority'
import type { Action } from '@/constants/actions.constant'
import type { ReactNode } from 'react'

interface AuthorityCheckProps {
    action: Action
    children: ReactNode
    fallback?: ReactNode
}

/** Renders children only when the user's role allows `action` (the server checks again). */
export default function AuthorityCheck({ action, children, fallback = null }: AuthorityCheckProps) {
    return <>{useAuthority(action) ? children : fallback}</>
}
