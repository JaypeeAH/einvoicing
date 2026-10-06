import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface PageHeaderProps {
    title: ReactNode
    description?: ReactNode
    /** Buttons shown on the right (stacked below the title on small screens). */
    actions?: ReactNode
    className?: string
}

/** Page title, one-line description and primary actions. */
export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div
            className={classNames('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}
        >
            <div className="min-w-0">
                <h3 className="heading-text">{title}</h3>
                {description && <p className="mt-1 max-w-3xl text-gray-500 dark:text-gray-400">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">{actions}</div>}
        </div>
    )
}
