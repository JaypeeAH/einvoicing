import type { Metadata } from 'next'
import AccountClientPage from '@/components/account/AccountClientPage'

export const metadata: Metadata = { title: 'My account' }

export default function AccountPage() {
    return <AccountClientPage />
}
