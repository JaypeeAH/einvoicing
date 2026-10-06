import Link from 'next/link'
import EmptyState from '@/components/shared/EmptyState'
import { LockedIcon } from '@/configs/icons.config'
import { homePath } from '@/configs/app.config'

/** Shown when the user's role cannot open a page. */
export default function Forbidden({ message }: { message?: string }) {
    return (
        <EmptyState
            icon={<LockedIcon />}
            title="You don’t have access to this page"
            description={message ?? 'Ask an owner or administrator of your organization to change your role.'}
            action={
                <Link href={homePath} className="font-semibold text-primary hover:underline">
                    Go to the dashboard
                </Link>
            }
        />
    )
}
