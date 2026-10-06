import SessionProvider from '@/components/auth/SessionProvider'
import { requireMember } from '@/server/auth/guards'

/** Print views: no navigation chrome, white page. */
export default async function PrintLayout({ children }: LayoutProps<'/print'>) {
    const user = await requireMember()
    return (
        <SessionProvider user={user}>
            <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">{children}</div>
        </SessionProvider>
    )
}
