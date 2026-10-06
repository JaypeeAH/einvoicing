import SessionProvider from '@/components/auth/SessionProvider'
import SimpleLayout from '@/components/template/SimpleLayout'
import { requireUser } from '@/server/auth/guards'

/** Pages for a signed-in user that work before onboarding or with an expired password. */
export default async function AccountLayout({ children }: LayoutProps<'/'>) {
    const user = await requireUser()
    return (
        <SessionProvider user={user}>
            <SimpleLayout>{children}</SimpleLayout>
        </SessionProvider>
    )
}
