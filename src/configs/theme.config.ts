import { THEME_ENUM } from '@/constants/theme.constant'
import type { Theme } from '@/@types/theme'

/** Default theme. The user's mode and side-nav state are persisted in the `theme` cookie. */
export const themeConfig: Theme = {
    themeSchema: 'default',
    direction: THEME_ENUM.DIR_LTR,
    mode: THEME_ENUM.MODE_LIGHT,
    panelExpand: false,
    controlSize: 'sm',
    locale: 'en',
    layout: {
        type: THEME_ENUM.LAYOUT_COLLAPSIBLE_SIDE,
        sideNavCollapse: false,
    },
}
