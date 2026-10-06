import Card from '@/components/ui/Card'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface StatCardProps {
    label: string
    value: ReactNode
    hint?: ReactNode
    icon?: ReactNode
    tone?: 'primary' | 'success' | 'warning' | 'error' | 'info'
    className?: string
}

const TONES = {
    primary: 'bg-primary-subtle text-primary',
    success: 'bg-success-subtle text-success',
    warning: 'bg-warning-subtle text-warning',
    error: 'bg-error-subtle text-error',
    info: 'bg-info-subtle text-info',
}

/** A single key figure on the dashboard. */
export default function StatCard({ label, value, hint, icon, tone = 'primary', className }: StatCardProps) {
    return (
        <Card className={className} bodyClass="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-500">{label}</div>
                <div className="mt-1 truncate text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
                {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
            </div>
            {icon && (
                <div
                    className={classNames(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl',
                        TONES[tone],
                    )}
                >
                    {icon}
                </div>
            )}
        </Card>
    )
}
