import type { LAYOUT_COLLAPSIBLE_SIDE } from '@/constants/theme.constant'

export type Mode = 'light' | 'dark'

export type Direction = 'ltr' | 'rtl'

export type ControlSize = 'lg' | 'md' | 'sm'

export type LayoutType = typeof LAYOUT_COLLAPSIBLE_SIDE

export interface Theme {
    themeSchema: string
    direction: Direction
    mode: Mode
    panelExpand: boolean
    controlSize: ControlSize
    locale: string
    layout: {
        type: LayoutType
        sideNavCollapse: boolean
    }
}

export type PartialTheme = Partial<Omit<Theme, 'layout'>> & { layout?: Partial<Theme['layout']> }
