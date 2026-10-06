import classNames from '@/utils/classNames'
import type { CommonProps } from '@/@types/common'
import type { ElementType } from 'react'

interface ContainerProps extends CommonProps {
    asElement?: ElementType
}

/** Centered, max-width page container. */
export default function Container({ asElement: Component = 'div', className, children, ...rest }: ContainerProps) {
    return (
        <Component className={classNames('container mx-auto', className)} {...rest}>
            {children}
        </Component>
    )
}
