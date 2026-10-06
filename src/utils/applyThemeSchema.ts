import type { ThemeVariables } from '@/configs/preset-theme-schema.config'
import type { Mode } from '@/@types/theme'

const VARIABLE_MAP = {
    primary: '--primary',
    primaryDeep: '--primary-deep',
    primaryMild: '--primary-mild',
    primarySubtle: '--primary-subtle',
    neutral: '--neutral',
} as const

/** Applies a preset colour schema by overriding the CSS variable tokens on <html>. */
export default function applyThemeSchema(schema: string, mode: Mode, presets: Record<string, ThemeVariables>) {
    if (typeof document === 'undefined') return
    const preset = presets[schema] || presets.default
    if (!preset) return
    const variables = preset[mode]
    const root = document.documentElement
    Object.entries(VARIABLE_MAP).forEach(([key, cssVariable]) => {
        root.style.setProperty(cssVariable, variables[key as keyof typeof VARIABLE_MAP])
    })
}
