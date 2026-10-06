import Tag from '@/components/ui/Tag'
import classNames from '@/utils/classNames'
import type { BadgeOption } from '@/@types/common'

interface StatusBadgeProps {
    option: BadgeOption | undefined | null
    className?: string
}

/** Coloured status pill from a BadgeOption (see @types/invoices/InvoiceStatusOptions). */
export default function StatusBadge({ option, className }: StatusBadgeProps) {
    if (!option) return null
    return <Tag className={classNames('border-0', option.badgeClass, className)}>{option.label}</Tag>
}
