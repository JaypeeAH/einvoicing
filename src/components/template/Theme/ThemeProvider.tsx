'use client'

import { useState, useLayoutEffect, useCallback, useRef, useEffect } from 'react'
import ThemeContext from './ThemeContext'
import ConfigProvider from '@/components/ui/ConfigProvider'
import applyTheme from '@/utils/applyThemeSchema'
import { setTheme as setThemeCookie } from '@/server/actions/theme'
import presetThemeSchemaConfig from '@/configs/preset-theme-schema.config'
import { themeConfig } from '@/configs/theme.config'
import { setThemeMode } from '@/utils/setThemeMode'
import type { ProviderProps } from '@/@types/common'
import type { PartialTheme, Theme } from '@/@types/theme'

export interface ThemeProviderProps extends ProviderProps {
    /** Preferences read from the theme cookie on the server. */
    theme: PartialTheme
}

const mergeTheme = (base: Theme, patch: PartialTheme): Theme => ({
    ...base,
    ...patch,
    layout: { ...base.layout, ...patch.layout },
})

export default function ThemeProvider({ children, theme }: ThemeProviderProps) {
    const [themeState, setThemeState] = useState<Theme>(() => mergeTheme(themeConfig, theme))
    const latest = useRef(themeState)
    const persist = useRef(false)

    useLayoutEffect(() => {
        latest.current = themeState
        applyTheme(themeState.themeSchema || 'default', themeState.mode, presetThemeSchemaConfig)
        setThemeMode(themeState.mode)
    }, [themeState])

    // Save to the cookie after a user change (not on first load), outside of render
    useEffect(() => {
        if (!persist.current) return
        void setThemeCookie(
            JSON.stringify({
                state: { mode: themeState.mode, layout: { sideNavCollapse: themeState.layout.sideNavCollapse } },
            }),
        )
    }, [themeState])

    const handleSetTheme = useCallback((payload: ((param: Theme) => PartialTheme) | PartialTheme) => {
        persist.current = true
        const patch = typeof payload === 'function' ? payload(latest.current) : payload
        setThemeState((current) => mergeTheme(current, patch))
    }, [])

    return (
        <ThemeContext.Provider value={{ theme: themeState, setTheme: handleSetTheme }}>
            <ConfigProvider value={themeState}>{children}</ConfigProvider>
        </ThemeContext.Provider>
    )
}
