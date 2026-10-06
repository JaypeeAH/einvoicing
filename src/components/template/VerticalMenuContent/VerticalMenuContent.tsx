'use client'

import Link from 'next/link'
import Menu from '@/components/ui/Menu'
import MenuItem from '@/components/ui/Menu/MenuItem'
import MenuGroup from '@/components/ui/Menu/MenuGroup'
import Tooltip from '@/components/ui/Tooltip'
import navigationIcon from '@/configs/icons.config'
import type { Direction } from '@/@types/theme'
import type { NavigationTree } from '@/@types/navigation'

export interface VerticalMenuContentProps {
    collapsed?: boolean
    routeKey: string
    navigationTree: NavigationTree[]
    direction?: Direction
    onMenuItemClick?: () => void
}

/** Side-navigation menu, grouped by task. Collapsed: icons only, with the title as a tooltip. */
export default function VerticalMenuContent({
    collapsed,
    routeKey,
    navigationTree,
    direction = 'ltr',
    onMenuItemClick,
}: VerticalMenuContentProps) {
    const renderItem = (nav: NavigationTree) => {
        const link = (
            <Link
                href={nav.path}
                className="flex h-full w-full items-center gap-3"
                onClick={onMenuItemClick}
                aria-current={nav.key === routeKey ? 'page' : undefined}
            >
                <span className="text-2xl">{navigationIcon[nav.icon]}</span>
                {!collapsed && <span>{nav.title}</span>}
            </Link>
        )
        return (
            <MenuItem key={nav.key} eventKey={nav.key}>
                {collapsed ? (
                    <Tooltip title={nav.title} placement={direction === 'rtl' ? 'left' : 'right'}>
                        {link}
                    </Tooltip>
                ) : (
                    link
                )}
            </MenuItem>
        )
    }

    return (
        <Menu className="px-4 pb-4" sideCollapsed={collapsed} defaultActiveKeys={[routeKey]}>
            {navigationTree.map((group) =>
                group.type === 'title' ? (
                    <MenuGroup key={group.key} label={group.title}>
                        {group.subMenu.map(renderItem)}
                    </MenuGroup>
                ) : (
                    renderItem(group)
                ),
            )}
        </Menu>
    )
}
