import classNames from '@/utils/classNames'
import type { ComponentType } from 'react'

export interface WithHeaderItemProps {
    className?: string
    hoverable?: boolean
}

/** Wraps a component in the standard header-action styling (padding, hover background). */
const withHeaderItem = <T extends { className?: string }>(Component: ComponentType<T>) => {
    const HeaderItem = (props: T & WithHeaderItemProps) => {
        const { className, hoverable = true, ...rest } = props
        return (
            <Component
                {...(rest as T)}
                className={classNames('header-action-item', hoverable && 'header-action-item-hoverable', className)}
            />
        )
    }
    HeaderItem.displayName = `withHeaderItem(${Component.displayName || Component.name || 'Component'})`
    return HeaderItem
}

export default withHeaderItem
