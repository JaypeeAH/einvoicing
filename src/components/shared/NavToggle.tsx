import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbMenu2 } from 'react-icons/tb'
import type { CommonProps } from '@/@types/common'

interface NavToggleProps extends CommonProps {
    toggled?: boolean
    /** `sidebar` shows collapse/expand icons; `menu` shows a hamburger. */
    variant?: 'sidebar' | 'menu'
}

/** Icon button that toggles the side navigation. */
export default function NavToggle({ toggled, className, variant = 'sidebar' }: NavToggleProps) {
    const Icon = variant === 'menu' ? TbMenu2 : toggled ? TbLayoutSidebarLeftExpand : TbLayoutSidebarLeftCollapse
    return (
        <div className={className}>
            <Icon aria-label={toggled ? 'Expand navigation' : 'Collapse navigation'} />
        </div>
    )
}
