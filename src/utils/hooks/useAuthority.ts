'use client'

import { useSessionStore } from '@/stores/SessionStore'
import { hasAuthorityTo } from '@/utils/hasAuthority'
import type { Action } from '@/constants/actions.constant'

/** True when the signed-in user's role allows `action` in the current organization. */
export default function useAuthority(action: Action) {
    const role = useSessionStore((state) => state.user?.role)
    return hasAuthorityTo(role, action)
}
