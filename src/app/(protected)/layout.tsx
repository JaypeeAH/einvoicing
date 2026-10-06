import PostLoginLayout from '@/components/template/PostLoginLayout'
import SessionProvider from '@/components/auth/SessionProvider'
import { requireMember } from '@/server/auth/guards'

/** Every page in the app shell needs a signed-in member of an organization. */
export default async function ProtectedLayout({ children }: LayoutProps<'/'>) {
    const user = await requireMember()
    return (
        <SessionProvider user={user}>
            <PostLoginLayout>{children}</PostLoginLayout>
        </SessionProvider>
    )
}
