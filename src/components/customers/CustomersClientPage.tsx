'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Segment from '@/components/ui/Segment'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable'
import DebounceInput from '@/components/shared/DebounceInput'
import EmptyState from '@/components/shared/EmptyState'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StatusBadge from '@/components/shared/StatusBadge'
import CustomerDialog from '@/components/customers/dialogs/CustomerDialog'
import { useCustomersStore } from '@/stores/CustomersStore'
import { apiDeleteCustomer } from '@/services/customers'
import useAuthority from '@/utils/hooks/useAuthority'
import { formatTinWithBranch } from '@/utils/tin'
import { ACTION_CUSTOMER_DELETE, ACTION_CUSTOMER_MANAGE } from '@/constants/actions.constant'
import { CUSTOMER_TYPE_LABELS } from '@/constants/bir.constant'
import { AddIcon, CustomersNavIcon, DeleteIcon, EditIcon, SearchIcon } from '@/configs/icons.config'
import type { Customer } from '@/@types/customers/Customer'

const ACTIVE_BADGE = { value: 'active', label: 'Active', badgeClass: 'bg-success-subtle text-success' }
const INACTIVE_BADGE = {
    value: 'inactive',
    label: 'Inactive',
    badgeClass: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
}

/** Customer list with search, add/edit and delete. */
export default function CustomersClientPage() {
    const { records, total, page, size, query, filter, loading, error } = useCustomersStore()
    const { setPage, setQuery, setFilter, refreshPage } = useCustomersStore()
    const canManage = useAuthority(ACTION_CUSTOMER_MANAGE)
    const canDelete = useAuthority(ACTION_CUSTOMER_DELETE)

    const [editing, setEditing] = useState<Customer | null | undefined>(undefined)
    const [deleting, setDeleting] = useState<Customer | null>(null)
    const [deletingBusy, setDeletingBusy] = useState(false)

    const onDelete = async () => {
        if (!deleting) return
        setDeletingBusy(true)
        try {
            await apiDeleteCustomer(deleting.id)
            toastSuccess('Customer deleted.')
            setDeleting(null)
            refreshPage()
        } catch (error) {
            toastError('Could not delete the customer.', error)
        } finally {
            setDeletingBusy(false)
        }
    }

    const columns: DataTableColumn<Customer>[] = [
        {
            key: 'name',
            header: 'Customer',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{row.registeredName}</div>
                    {row.businessName && <div className="text-xs text-gray-500">{row.businessName}</div>}
                </div>
            ),
        },
        { key: 'tin', header: 'TIN', cell: (row) => formatTinWithBranch(row.tin, row.branchCode) || '—' },
        { key: 'type', header: 'Type', cell: (row) => CUSTOMER_TYPE_LABELS[row.customerType], hideBelow: 'md' },
        {
            key: 'vat',
            header: 'VAT',
            cell: (row) => (row.isVatRegistered ? 'VAT-registered' : 'Non-VAT'),
            hideBelow: 'md',
        },
        { key: 'email', header: 'Email', cell: (row) => row.email || '—', hideBelow: 'lg' },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge option={row.isActive ? ACTIVE_BADGE : INACTIVE_BADGE} />,
        },
        {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (row) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<EditIcon />}
                            aria-label="Edit"
                            onClick={() => setEditing(row)}
                        />
                    )}
                    {canDelete && (
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<DeleteIcon />}
                            aria-label="Delete"
                            className="hover:text-error"
                            onClick={() => setDeleting(row)}
                        />
                    )}
                </div>
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Customers"
                description="Buyers you issue invoices to. Their registered name, TIN and address are copied onto each invoice."
                actions={
                    canManage && (
                        <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setEditing(null)}>
                            Add customer
                        </Button>
                    )
                }
            />
            <Card>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <DebounceInput
                        className="sm:max-w-sm"
                        size="sm"
                        prefix={<SearchIcon className="text-lg" />}
                        placeholder="Search name or TIN"
                        value={query}
                        onChange={setQuery}
                    />
                    <Segment
                        size="sm"
                        value={filter.active === undefined ? 'all' : filter.active ? 'active' : 'inactive'}
                        onChange={(value) => setFilter({ active: value === 'all' ? undefined : value === 'active' })}
                    >
                        <Segment.Item value="active">Active</Segment.Item>
                        <Segment.Item value="inactive">Inactive</Segment.Item>
                        <Segment.Item value="all">All</Segment.Item>
                    </Segment>
                </div>
                <DataTable
                    columns={columns}
                    records={records}
                    rowKey={(row) => row.id}
                    loading={loading}
                    error={error}
                    onRowClick={canManage ? (row) => setEditing(row) : undefined}
                    paging={{ page, size, total, onChange: setPage }}
                    empty={
                        <EmptyState
                            icon={<CustomersNavIcon />}
                            title={query ? 'No customers match your search' : 'No customers yet'}
                            description="Save your regular buyers so their BIR details are filled in automatically."
                            action={
                                canManage &&
                                !query && (
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        icon={<AddIcon />}
                                        onClick={() => setEditing(null)}
                                    >
                                        Add customer
                                    </Button>
                                )
                            }
                        />
                    }
                />
            </Card>

            <CustomerDialog
                isOpen={editing !== undefined}
                customer={editing}
                onClose={() => setEditing(undefined)}
                onSaved={() => {
                    setEditing(undefined)
                    refreshPage()
                }}
            />
            <ConfirmDialog
                isOpen={!!deleting}
                type="danger"
                title="Delete this customer?"
                confirmText="Delete"
                onClose={() => setDeleting(null)}
                onConfirm={onDelete}
                closable={!deletingBusy}
                confirmButtonProps={{ loading: deletingBusy }}
            >
                <strong>{deleting?.registeredName}</strong> will be removed from your customer list. Invoices already
                issued to them are not affected.
            </ConfirmDialog>
        </>
    )
}
