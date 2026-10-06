import Container from '@/components/shared/Container'
import classNames from '@/utils/classNames'
import { PAGE_CONTAINER_GUTTER_X } from '@/constants/theme.constant'
import {
    portalName,
    privacyPolicyUrl,
    providerName,
    softwareName,
    softwareVersion,
    termsOfUseUrl,
} from '@/configs/app.config'

export type FooterPageContainerType = 'gutterless' | 'contained'

interface FooterProps {
    pageContainerType: FooterPageContainerType
    className?: string
}

const FooterContent = () => (
    <div className="flex w-full flex-auto flex-col-reverse justify-between gap-2 md:flex-row md:items-center md:gap-4">
        <span className="flex flex-row flex-wrap gap-1">
            <span className="font-semibold whitespace-nowrap">{portalName}</span>
            <span>
                &copy; {new Date().getFullYear()} {providerName}
            </span>
            <span className="text-gray-400">
                · {softwareName} v{softwareVersion}
            </span>
        </span>
        <div className="flex flex-row flex-wrap gap-1">
            <a className="hover:text-primary" href={termsOfUseUrl} target="_blank" rel="noreferrer">
                Terms &amp; Conditions
            </a>
            <span className="mx-2 text-gray-300">|</span>
            <a className="hover:text-primary" href={privacyPolicyUrl} target="_blank" rel="noreferrer">
                Privacy Policy
            </a>
        </div>
    </div>
)

export default function Footer({ pageContainerType = 'contained', className }: FooterProps) {
    return (
        <footer
            className={classNames(
                `footer flex flex-auto items-center py-4 text-sm ${PAGE_CONTAINER_GUTTER_X} print:hidden`,
                className,
            )}
        >
            {pageContainerType === 'contained' ? (
                <Container>
                    <FooterContent />
                </Container>
            ) : (
                <FooterContent />
            )}
        </footer>
    )
}
