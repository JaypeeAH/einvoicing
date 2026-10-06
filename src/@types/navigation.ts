import type { Action } from '@/constants/actions.constant'

export interface NavigationTree {
    key: string
    path: string
    title: string
    icon: string
    type: 'title' | 'collapse' | 'item'
    /** Actions the user needs (any of) to see the entry. Empty = every member. */
    authority: Action[]
    subMenu: NavigationTree[]
}
