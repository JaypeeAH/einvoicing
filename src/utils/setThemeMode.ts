import { MODE_DARK, MODE_LIGHT } from '@/constants/theme.constant'
import type { Mode } from '@/@types/theme'

/** Toggles the `dark` class on <html> (Tailwind `dark:` variants). */
export const setThemeMode = (mode: Mode) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.remove(mode === MODE_DARK ? MODE_LIGHT : MODE_DARK)
    root.classList.add(mode)
}
