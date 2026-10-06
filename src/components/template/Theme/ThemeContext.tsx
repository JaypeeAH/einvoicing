'use client'

import { createContext } from 'react'
import { themeConfig } from '@/configs/theme.config'
import type { Theme, PartialTheme } from '@/@types/theme'

interface IThemeContext {
    theme: Theme
    setTheme: (payload: ((param: Theme) => PartialTheme) | PartialTheme) => void
}

const ThemeContext = createContext<IThemeContext>({
    theme: themeConfig,
    setTheme: () => {},
})

export default ThemeContext
