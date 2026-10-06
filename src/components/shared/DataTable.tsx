'use client'

import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Skeleton from '@/components/ui/Skeleton'
import Alert from '@/components/ui/Alert'
import EmptyState from '@/components/shared/EmptyState'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

export interface DataTableColumn<T> {
    key: string
    header: ReactNode
    /** Cell content. Defaults to `row[key]`. */
    cell?: (row: T) => ReactNode
    align?: 'left' | 'right' | 'center'
    className?: string
    /** Hide below this breakpoint to keep tables readable on phones. */
    hideBelow?: 'sm' | 'md' | 'lg'
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[]
    records: T[]
    rowKey: (row: T) => string
    loading?: boolean
    error?: string | null
    onRowClick?: (row: T) => void
    empty?: ReactNode
    /** Server-side paging; omit for unpaged tables. */
    paging?: { page: number; size: number; total: number; onChange: (page: number) => void }
    footer?: ReactNode
    compact?: boolean
    className?: string
}

const HIDE_BELOW = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' }
const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }

/** Table with loading skeletons, empty state, error message and pagination (wraps ui/Table). */
export default function DataTable<T>({
    columns,
    records,
    rowKey,
    loading,
    error,
    onRowClick,
    empty,
    paging,
    footer,
    compact,
    className,
}: DataTableProps<T>) {
    const columnClass = (column: DataTableColumn<T>) =>
        classNames(
            column.align && ALIGN[column.align],
            column.hideBelow && HIDE_BELOW[column.hideBelow],
            column.className,
        )

    const showSkeleton = loading && records.length === 0

    return (
        <div className={classNames('relative', className)}>
            {error && (
                <Alert type="danger" showIcon className="mb-4" duration={0}>
                    {error}
                </Alert>
            )}
            <Table compact={compact} hoverable={!!onRowClick}>
                <Table.THead>
                    <Table.Tr>
                        {columns.map((column) => (
                            <Table.Th key={column.key} className={columnClass(column)}>
                                {column.header}
                            </Table.Th>
                        ))}
                    </Table.Tr>
                </Table.THead>
                <Table.TBody>
                    {showSkeleton &&
                        Array.from({ length: 5 }).map((_, index) => (
                            <Table.Tr key={`skeleton-${index}`}>
                                {columns.map((column) => (
                                    <Table.Td key={column.key} className={columnClass(column)}>
                                        <Skeleton height={12} />
                                    </Table.Td>
                                ))}
                            </Table.Tr>
                        ))}
                    {!showSkeleton &&
                        records.map((row) => (
                            <Table.Tr
                                key={rowKey(row)}
                                className={classNames(onRowClick && 'cursor-pointer', loading && 'opacity-60')}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                            >
                                {columns.map((column) => (
                                    <Table.Td key={column.key} className={columnClass(column)}>
                                        {column.cell
                                            ? column.cell(row)
                                            : String((row as Record<string, unknown>)[column.key] ?? '')}
                                    </Table.Td>
                                ))}
                            </Table.Tr>
                        ))}
                </Table.TBody>
                {footer && <Table.TFoot>{footer}</Table.TFoot>}
            </Table>
            {!loading && !error && records.length === 0 && (empty ?? <EmptyState title="Nothing here yet" />)}
            {paging && paging.total > paging.size && (
                <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-700">
                    <Pagination
                        currentPage={paging.page}
                        pageSize={paging.size}
                        total={paging.total}
                        displayTotal
                        onChange={paging.onChange}
                    />
                </div>
            )}
        </div>
    )
}
