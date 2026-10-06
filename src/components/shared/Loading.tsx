import Spinner from '@/components/ui/Spinner'
import classNames from '@/utils/classNames'
import type { CommonProps } from '@/@types/common'

interface LoadingProps extends CommonProps {
    loading: boolean
    /** `default` replaces the children with a spinner; `cover` keeps them and overlays a spinner. */
    type?: 'default' | 'cover'
    spinnerClass?: string
}

/** Loading indicator used by Card and data views. */
export default function Loading({ loading, type = 'cover', children, className, spinnerClass }: LoadingProps) {
    if (type === 'default') {
        return loading ? (
            <div className={classNames('flex h-full w-full items-center justify-center py-10', className)}>
                <Spinner size={36} className={spinnerClass} />
            </div>
        ) : (
            <>{children}</>
        )
    }

    return (
        <>
            {children}
            {loading && (
                <div
                    className={classNames(
                        'absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-white/50 dark:bg-gray-800/60',
                        className,
                    )}
                >
                    <Spinner size={36} className={spinnerClass} />
                </div>
            )}
        </>
    )
}
