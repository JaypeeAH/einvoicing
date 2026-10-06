import classNames from '@/utils/classNames'
import { portalName } from '@/configs/app.config'
import { InvoicesNavIcon } from '@/configs/icons.config'
import type { CommonProps } from '@/@types/common'

export interface LogoProps extends CommonProps {
    /** `full` shows the mark and the product name; `streamline` only the mark (collapsed side nav). */
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
}

/** Product logo: a brand-coloured mark with the portal name. Replace with an image if you have one. */
const Logo = ({ type = 'full', mode = 'light', className, imgClass, style }: LogoProps) => (
    <div className={classNames('logo flex items-center gap-2', className)} style={style}>
        <span
            className={classNames(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xl text-neutral',
                imgClass,
            )}
        >
            <InvoicesNavIcon />
        </span>
        {type === 'full' && (
            <span
                className={classNames(
                    'truncate text-base font-bold tracking-tight',
                    mode === 'dark' ? 'text-gray-100' : 'text-gray-900',
                )}
            >
                {portalName}
            </span>
        )}
    </div>
)

export default Logo
