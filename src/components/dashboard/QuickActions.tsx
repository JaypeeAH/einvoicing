'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import useAuthority from '@/utils/hooks/useAuthority'
import { customersPath, newInvoicePath, salesJournalPath } from '@/configs/app.config'
import { ACTION_CUSTOMER_MANAGE, ACTION_INVOICE_ISSUE, ACTION_REPORT_VIEW } from '@/constants/actions.constant'
import { AddIcon, CustomerIcon, SalesJournalNavIcon } from '@/configs/icons.config'
import type { ReactNode } from 'react'

interface QuickAction {
    key: string
    label: string
    description: string
    href: string
    icon: ReactNode
}

/** Shortcuts to the most common tasks the user's role allows. */
export default function QuickActions() {
    const canIssue = useAuthority(ACTION_INVOICE_ISSUE)
    const canManageCustomers = useAuthority(ACTION_CUSTOMER_MANAGE)
    const canViewReports = useAuthority(ACTION_REPORT_VIEW)

    const actions: QuickAction[] = [
        ...(canIssue
            ? [
                  {
                      key: 'invoice',
                      label: 'New invoice',
                      description: 'Bill a customer',
                      href: newInvoicePath,
                      icon: <AddIcon />,
                  },
              ]
            : []),
        ...(canManageCustomers
            ? [
                  {
                      key: 'customer',
                      label: 'Add customer',
                      description: 'Save a buyer’s BIR details',
                      href: customersPath,
                      icon: <CustomerIcon />,
                  },
              ]
            : []),
        ...(canViewReports
            ? [
                  {
                      key: 'journal',
                      label: 'Sales Journal',
                      description: 'This month’s book of sales',
                      href: salesJournalPath,
                      icon: <SalesJournalNavIcon />,
                  },
              ]
            : []),
    ]

    if (actions.length === 0) return null

    return (
        <Card header={{ content: 'Quick actions' }}>
            <div className="flex flex-col gap-2">
                {actions.map((action) => (
                    <Link
                        key={action.key}
                        href={action.href}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-primary hover:bg-primary-subtle dark:border-gray-700"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-xl text-primary">
                            {action.icon}
                        </span>
                        <span className="min-w-0">
                            <span className="block font-semibold text-gray-900 dark:text-gray-100">{action.label}</span>
                            <span className="block text-sm text-gray-500">{action.description}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </Card>
    )
}
