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
import ProductDialog from '@/components/products/dialogs/ProductDialog'
import { useProductsStore } from '@/stores/ProductsStore'
import { apiDeleteProduct } from '@/services/products'
import useAuthority from '@/utils/hooks/useAuthority'
import { formatPeso } from '@/utils/money'
import { ACTION_PRODUCT_MANAGE } from '@/constants/actions.constant'
import { TAX_TREATMENT_LABELS } from '@/constants/bir.constant'
import { AddIcon, DeleteIcon, EditIcon, ProductsNavIcon, SearchIcon } from '@/configs/icons.config'
import type { Product } from '@/@types/products/Product'

const ACTIVE_BADGE = { value: 'active', label: 'Active', badgeClass: 'bg-success-subtle text-success' }
const INACTIVE_BADGE = {
    value: 'inactive',
    label: 'Inactive',
    badgeClass: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
}

/** Catalog of goods and services used to fill invoice lines quickly. */
export default function ProductsClientPage() {
    const { records, total, page, size, query, filter, loading, error } = useProductsStore()
    const { setPage, setQuery, setFilter, refreshPage } = useProductsStore()
    const canManage = useAuthority(ACTION_PRODUCT_MANAGE)

    const [editing, setEditing] = useState<Product | null | undefined>(undefined)
    const [deleting, setDeleting] = useState<Product | null>(null)
    const [deletingBusy, setDeletingBusy] = useState(false)

    const onDelete = async () => {
        if (!deleting) return
        setDeletingBusy(true)
        try {
            await apiDeleteProduct(deleting.id)
            toastSuccess('Item deleted.')
            setDeleting(null)
            refreshPage()
        } catch (error) {
            toastError('Could not delete the item.', error)
        } finally {
            setDeletingBusy(false)
        }
    }

    const columns: DataTableColumn<Product>[] = [
        {
            key: 'name',
            header: 'Item',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</div>
                    <div className="text-xs text-gray-500">
                        {[row.sku, row.isService ? 'Service' : 'Goods'].filter(Boolean).join(' · ')}
                    </div>
                </div>
            ),
        },
        { key: 'unit', header: 'Unit', cell: (row) => row.unit, hideBelow: 'sm' },
        { key: 'price', header: 'Unit price', align: 'right', cell: (row) => formatPeso(row.unitPrice) },
        { key: 'tax', header: 'Tax', cell: (row) => TAX_TREATMENT_LABELS[row.taxTreatment], hideBelow: 'md' },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge option={row.isActive ? ACTIVE_BADGE : INACTIVE_BADGE} />,
            hideBelow: 'sm',
        },
        {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (row) =>
                canManage && (
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<EditIcon />}
                            aria-label="Edit"
                            onClick={() => setEditing(row)}
                        />
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<DeleteIcon />}
                            aria-label="Delete"
                            className="hover:text-error"
                            onClick={() => setDeleting(row)}
                        />
                    </div>
                ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Products & Services"
                description="Items you sell, with their default price and VAT treatment. Pick them when creating an invoice."
                actions={
                    canManage && (
                        <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setEditing(null)}>
                            Add item
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
                        placeholder="Search name, code or description"
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
                            icon={<ProductsNavIcon />}
                            title={query ? 'No items match your search' : 'No products or services yet'}
                            description="Add the goods and services you sell so invoices are quicker to fill in."
                            action={
                                canManage &&
                                !query && (
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        icon={<AddIcon />}
                                        onClick={() => setEditing(null)}
                                    >
                                        Add item
                                    </Button>
                                )
                            }
                        />
                    }
                />
            </Card>

            <ProductDialog
                isOpen={editing !== undefined}
                product={editing}
                onClose={() => setEditing(undefined)}
                onSaved={() => {
                    setEditing(undefined)
                    refreshPage()
                }}
            />
            <ConfirmDialog
                isOpen={!!deleting}
                type="danger"
                title="Delete this item?"
                confirmText="Delete"
                onClose={() => setDeleting(null)}
                onConfirm={onDelete}
                closable={!deletingBusy}
                confirmButtonProps={{ loading: deletingBusy }}
            >
                <strong>{deleting?.name}</strong> will be removed from your catalog. Issued invoices keep their line
                descriptions and are not affected.
            </ConfirmDialog>
        </>
    )
}
