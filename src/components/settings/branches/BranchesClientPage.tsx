'use client'

import { useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Tag from '@/components/ui/Tag'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import BranchDialog from '@/components/settings/branches/dialogs/BranchDialog'
import { useBranchesStore } from '@/stores/BranchesStore'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { seriesPath } from '@/configs/app.config'
import { AddIcon, BranchesNavIcon, EditIcon } from '@/configs/icons.config'
import type { Branch } from '@/@types/branches/Branch'
import type { BadgeOption } from '@/@types/common'

const BRANCH_STATUS_OPTIONS: Record<Branch['status'], BadgeOption<Branch['status']>> = {
    active: { value: 'active', label: 'Open', badgeClass: 'bg-success-subtle text-success' },
    closed: {
        value: 'closed',
        label: 'Closed',
        badgeClass: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
    },
}

const EMPTY_BRANCHES: Branch[] = []

/** BIR-registered places of business (head office 00000 plus branches). */
export default function BranchesClientPage() {
    useSetBreadcrumbs([{ label: 'Administration' }, { label: 'Branches' }])

    const branches = useBranchesStore((state) => state.data) ?? EMPTY_BRANCHES
    const loading = useBranchesStore((state) => state.loading)
    const error = useBranchesStore((state) => state.error)
    const refresh = useBranchesStore((state) => state.refresh)

    const [editing, setEditing] = useState<Branch | null | undefined>(undefined)

    const columns: DataTableColumn<Branch>[] = [
        {
            key: 'code',
            header: 'Code',
            cell: (row) => (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{row.code}</span>
                    {row.isHeadOffice && <Tag className="border-0 bg-primary-subtle text-primary">Head office</Tag>}
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Branch',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</div>
                    <div className="text-xs text-gray-500 md:hidden">{row.address}</div>
                </div>
            ),
        },
        { key: 'address', header: 'Address', cell: (row) => row.address, hideBelow: 'md' },
        { key: 'rdoCode', header: 'RDO', cell: (row) => row.rdoCode, hideBelow: 'sm' },
        { key: 'status', header: 'Status', cell: (row) => <StatusBadge option={BRANCH_STATUS_OPTIONS[row.status]} /> },
        {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (row) => (
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<EditIcon />}
                        aria-label="Edit"
                        onClick={() => setEditing(row)}
                    />
                </div>
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Branches"
                description="Every place of business registered with the BIR. Each branch has its own 5-digit branch code, and its invoices show that code after your TIN."
                actions={
                    <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setEditing(null)}>
                        Add branch
                    </Button>
                }
            />
            <Alert type="info" showIcon duration={0} className="mb-4">
                <span className="font-normal">
                    Your head office (branch 00000) was created automatically when you registered. Each branch must be
                    registered with the BIR and needs its own{' '}
                    <Link href={seriesPath} className="font-semibold underline">
                        invoice series
                    </Link>{' '}
                    before it can issue invoices.
                </span>
            </Alert>
            <Card>
                <DataTable
                    columns={columns}
                    records={branches}
                    rowKey={(row) => row.id}
                    loading={loading}
                    error={error}
                    onRowClick={(row) => setEditing(row)}
                    empty={
                        <EmptyState
                            icon={<BranchesNavIcon />}
                            title="No branches yet"
                            description="Your head office appears here once your business is registered."
                        />
                    }
                />
            </Card>

            <BranchDialog
                isOpen={editing !== undefined}
                branch={editing}
                onClose={() => setEditing(undefined)}
                onSaved={() => {
                    setEditing(undefined)
                    refresh()
                }}
            />
        </>
    )
}
