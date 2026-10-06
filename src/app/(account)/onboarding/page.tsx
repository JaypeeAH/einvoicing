import type { Metadata } from 'next'
import OnboardingClientPage from '@/components/account/OnboardingClientPage'

export const metadata: Metadata = { title: 'Register your business' }

export default function OnboardingPage() {
    return <OnboardingClientPage />
}
