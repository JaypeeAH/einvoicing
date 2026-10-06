'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { homePath } from '@/configs/app.config'
import classNames from '@/utils/classNames'
import ScrollBar from '@/components/ui/ScrollBar'
import Logo from '@/components/template/Logo'
import VerticalMenuContent from '@/components/template/VerticalMenuContent'
import useTheme from '@/utils/hooks/useTheme'
import useNavigation from '@/utils/hooks/useNavigation'
import queryRoute from '@/utils/queryRoute'
import {
    SIDE_NAV_WIDTH,
    SIDE_NAV_COLLAPSED_WIDTH,
    SIDE_NAV_CONTENT_GUTTER,
    HEADER_HEIGHT,
    LOGO_X_GUTTER,
} from '@/constants/theme.constant'

interface SideNavProps {
    className?: string
    contentClass?: string
}

const sideNavStyle = { width: SIDE_NAV_WIDTH, minWidth: SIDE_NAV_WIDTH }
const sideNavCollapseStyle = { width: SIDE_NAV_COLLAPSED_WIDTH, minWidth: SIDE_NAV_COLLAPSED_WIDTH }

/** Desktop side navigation (hidden below `lg`, where MobileNav takes over). */
export default function SideNav({ className, contentClass }: SideNavProps) {
    const pathname = usePathname()
    const { navigationTree } = useNavigation()
    const mode = useTheme((state) => state.mode)
    const direction = useTheme((state) => state.direction)
    const sideNavCollapse = useTheme((state) => state.layout.sideNavCollapse)

    return (
        <div
            style={sideNavCollapse ? sideNavCollapseStyle : sideNavStyle}
            className={classNames(
                'side-nav side-nav-bg hidden lg:block print:hidden',
                !sideNavCollapse && 'side-nav-expand',
                className,
            )}
        >
            <Link
                href={homePath}
                className="side-nav-header flex flex-col justify-center"
                style={{ height: HEADER_HEIGHT }}
            >
                <Logo
                    mode={mode}
                    type={sideNavCollapse ? 'streamline' : 'full'}
                    className={sideNavCollapse ? `${SIDE_NAV_CONTENT_GUTTER} justify-center` : LOGO_X_GUTTER}
                />
            </Link>
            <div className={classNames('side-nav-content', contentClass)}>
                <ScrollBar style={{ height: '100%' }} direction={direction}>
                    <VerticalMenuContent
                        collapsed={sideNavCollapse}
                        navigationTree={navigationTree}
                        routeKey={queryRoute(pathname).key}
                        direction={direction}
                    />
                </ScrollBar>
            </div>
        </div>
    )
}
