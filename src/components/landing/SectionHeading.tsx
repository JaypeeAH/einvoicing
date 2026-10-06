import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface SectionHeadingProps {
    eyebrow: string
    title: ReactNode
    description?: ReactNode
    className?: string
}

/** Centered heading used by every homepage section. */
export default function SectionHeading({ eyebrow, title, description, className }: SectionHeadingProps) {
    return (
        <div className={classNames('mx-auto max-w-2xl text-center', className)}>
            <div className="text-sm font-bold tracking-wider text-primary uppercase">{eyebrow}</div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
            {description && <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{description}</p>}
        </div>
    )
}
