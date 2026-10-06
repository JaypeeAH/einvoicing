'use client'

import SideNav from '@/components/template/SideNav'
import Header from '@/components/template/Header'
import MobileNav from '@/components/template/MobileNav'
import SideNavToggle from '@/components/template/SideNavToggle'
import HeaderSearch from '@/components/template/HeaderSearch'
import OrganizationSwitcher from '@/components/template/OrganizationSwitcher'
import UserDropdown from '@/components/template/UserDropdown'
import PageContainer from '@/components/template/PageContainer'
import EnvironmentBanner from '@/components/template/EnvironmentBanner'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import useBreadcrumbs from '@/utils/hooks/useBreadcrumbs'
import type { ProviderProps } from '@/@types/common'

/** The app shell: collapsible side navigation, header, breadcrumbs and page container. */
export default function PostLoginLayout({ children }: ProviderProps) {
    const breadcrumbs = useBreadcrumbs((state) => state.items)

    return (
        <div className="app-layout-collapsible-side flex flex-auto flex-col">
            <div className="flex min-w-0 flex-auto">
                <SideNav />
                <div className="relative flex min-h-screen w-full min-w-0 flex-auto flex-col border-l border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 print:border-0 print:bg-white">
                    <EnvironmentBanner />
                    <Header
                        className="bg-white shadow-sm dark:bg-gray-800 dark:shadow-2xl print:hidden"
                        headerStart={
                            <>
                                <MobileNav />
                                <SideNavToggle />
                                <HeaderSearch />
                            </>
                        }
                        headerEnd={
                            <>
                                <OrganizationSwitcher />
                                <UserDropdown />
                            </>
                        }
                    />
                    <div className="flex h-full flex-auto flex-col">
                        <PageContainer>
                            {breadcrumbs.length > 0 && (
                                <div className="mb-4 print:hidden">
                                    <Breadcrumbs items={breadcrumbs} />
                                </div>
                            )}
                            {children}
                        </PageContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
