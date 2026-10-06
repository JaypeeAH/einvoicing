import Link from 'next/link'
import EmptyState from '@/components/shared/EmptyState'
import { homePath } from '@/configs/app.config'
import { SearchIcon } from '@/configs/icons.config'

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <EmptyState
                icon={<SearchIcon />}
                title="Page not found"
                description="The page you are looking for does not exist or was moved."
                action={
                    <Link href={homePath} className="font-semibold text-primary hover:underline">
                        Go to the dashboard
                    </Link>
                }
            />
        </div>
    )
}
