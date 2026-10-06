import type { Metadata } from 'next'
import LandingHeader from '@/components/landing/LandingHeader'
import HeroSection from '@/components/landing/HeroSection'
import DeadlineSection from '@/components/landing/DeadlineSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import RolesSection from '@/components/landing/RolesSection'
import ComplianceSection from '@/components/landing/ComplianceSection'
import FaqSection from '@/components/landing/FaqSection'
import CallToActionSection from '@/components/landing/CallToActionSection'
import AuthHashHandler from '@/components/auth/AuthHashHandler'
import LandingMotionConfig from '@/components/landing/LandingMotionConfig'
import EnvironmentBanner from '@/components/template/EnvironmentBanner'
import Footer from '@/components/template/Footer'
import { portalDescription, portalName } from '@/configs/app.config'

export const metadata: Metadata = {
    title: { absolute: `${portalName} — BIR-ready invoicing for Philippine SMEs` },
    description: portalDescription,
}

/** Public homepage. Signed-out visitors see it at `/`; signed-in users are sent to the dashboard. */
export default function WelcomePage() {
    return (
        <LandingMotionConfig>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <AuthHashHandler />
                <EnvironmentBanner />
                <LandingHeader />
                <main>
                    <HeroSection />
                    <DeadlineSection />
                    <FeaturesSection />
                    <HowItWorksSection />
                    <RolesSection />
                    <ComplianceSection />
                    <FaqSection />
                    <CallToActionSection />
                </main>
                <div className="border-t border-gray-200 dark:border-gray-800">
                    <Footer pageContainerType="contained" />
                </div>
            </div>
        </LandingMotionConfig>
    )
}
