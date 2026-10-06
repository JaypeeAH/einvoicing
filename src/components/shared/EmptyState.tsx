import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface EmptyStateProps {
    icon?: ReactNode
    title: ReactNode
    description?: ReactNode
    action?: ReactNode
    className?: string
}

/** Friendly placeholder for empty lists, telling the user what to do next. */
export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={classNames('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
            {icon && <div className="mb-3 text-5xl text-gray-300 dark:text-gray-600">{icon}</div>}
            <h5 className="heading-text">{title}</h5>
            {description && <p className="mt-1 max-w-md text-gray-500">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
