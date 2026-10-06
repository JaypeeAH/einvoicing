'use client'

import { useMemo } from 'react'
import navigationConfig from '@/configs/navigation.config'
import { useSessionStore } from '@/stores/SessionStore'
import { hasAnyAuthority } from '@/utils/hasAuthority'
import type { NavigationTree } from '@/@types/navigation'

/** Side navigation filtered to what the user's role can open; empty groups are dropped. */
export default function useNavigation() {
    const role = useSessionStore((state) => state.user?.role)

    const navigationTree = useMemo<NavigationTree[]>(
        () =>
            navigationConfig
                .map((group) => ({
                    ...group,
                    subMenu: group.subMenu.filter((item) => hasAnyAuthority(role, item.authority)),
                }))
                .filter((group) => group.subMenu.length > 0),
        [role],
    )

    return { navigationTree }
}
