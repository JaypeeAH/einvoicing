import type { ReactNode, CSSProperties } from 'react'

export interface CommonProps {
    id?: string
    className?: string
    children?: ReactNode
    style?: CSSProperties
}

export interface ProviderProps {
    children: ReactNode
}

export interface Option<T = string> {
    value: T
    label: string
}

/** Option rendered as a coloured badge (status pickers, BadgeSelect). */
export interface BadgeOption<T = string> extends Option<T> {
    /** Tailwind classes for the badge, e.g. `bg-success-subtle text-success` */
    badgeClass?: string
}
