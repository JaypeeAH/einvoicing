'use server'

import { cookies } from 'next/headers'
import { THEME_COOKIE } from '@/constants/app.constant'
import type { PartialTheme } from '@/@types/theme'

/** Reads the persisted theme preferences (mode, side-nav collapse). */
export async function getTheme(): Promise<PartialTheme> {
    const value = (await cookies()).get(THEME_COOKIE)?.value
    if (!value) return {}
    try {
        const parsed = JSON.parse(value) as { state?: PartialTheme }
        const state = parsed.state ?? {}
        return {
            ...(state.mode === 'light' || state.mode === 'dark' ? { mode: state.mode } : {}),
            ...(typeof state.layout?.sideNavCollapse === 'boolean'
                ? { layout: { sideNavCollapse: state.layout.sideNavCollapse } }
                : {}),
        }
    } catch {
        return {}
    }
}

/** Persists theme preferences in a cookie so the first server render matches. */
export async function setTheme(value: string) {
    ;(await cookies()).set(THEME_COOKIE, value, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
    })
}
