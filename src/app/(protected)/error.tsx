'use client'

import Button from '@/components/ui/Button'
import EmptyState from '@/components/shared/EmptyState'
import { ErrorIcon } from '@/configs/icons.config'

/** Shown when a page fails to render. Nothing is lost — issued documents are already saved. */
export default function ProtectedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <EmptyState
            icon={<ErrorIcon />}
            title="Something went wrong"
            description={
                <>
                    This page could not be displayed. Please try again.
                    {error.digest && (
                        <span className="mt-1 block text-xs text-gray-400">Reference: {error.digest}</span>
                    )}
                </>
            }
            action={
                <Button size="sm" variant="solid" onClick={reset}>
                    Try again
                </Button>
            }
        />
    )
}
