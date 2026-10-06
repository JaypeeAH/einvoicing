'use client'

import { useContext } from 'react'
import ThemeContext from '@/components/template/Theme/ThemeContext'
import type { Mode, PartialTheme, Theme } from '@/@types/theme'

export interface ThemeState extends Theme {
    setTheme: (payload: ((param: Theme) => PartialTheme) | PartialTheme) => void
    setMode: (mode: Mode) => void
    setSideNavCollapse: (collapsed: boolean) => void
}

/** Theme state and setters, read through a selector: `useTheme((state) => state.mode)`. */
export default function useTheme<T>(selector: (state: ThemeState) => T): T {
    const { theme, setTheme } = useContext(ThemeContext)
    return selector({
        ...theme,
        setTheme,
        setMode: (mode) => setTheme({ mode }),
        setSideNavCollapse: (sideNavCollapse) => setTheme({ layout: { sideNavCollapse } }),
    })
}
