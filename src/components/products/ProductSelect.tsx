'use client'

import { useMemo, useState } from 'react'
import Select from '@/components/ui/Select'
import { useSWRProducts } from '@/services/products'
import useDebounce from '@/utils/hooks/useDebounce'
import { formatPeso } from '@/utils/money'
import type { Product } from '@/@types/products/Product'

interface ProductOption {
    value: string
    label: string
    product: Product
}

interface ProductSelectProps {
    onSelect: (product: Product) => void
    placeholder?: string
    isDisabled?: boolean
}

/** Searchable product picker used to fill an invoice line. Clears itself after each pick. */
export default function ProductSelect({ onSelect, placeholder, isDisabled }: ProductSelectProps) {
    const [input, setInput] = useState('')
    const query = useDebounce(input.trim(), 300)
    const { data, isLoading } = useSWRProducts({ query, size: 20, active: true })

    const options = useMemo<ProductOption[]>(
        () => (data?.records ?? []).map((product) => ({ value: product.id, label: product.name, product })),
        [data],
    )

    return (
        <Select<ProductOption>
            size="sm"
            options={options}
            value={null}
            onChange={(option) => option && onSelect(option.product)}
            onInputChange={(text, meta) => {
                if (meta.action === 'input-change') setInput(text)
            }}
            filterOption={null}
            isDisabled={isDisabled}
            isLoading={isLoading}
            placeholder={placeholder ?? 'Pick a product or service…'}
            noOptionsMessage={() => (query ? 'No matching items' : 'No products yet')}
            formatOptionLabel={(option) => (
                <div className="flex w-full items-center justify-between gap-3">
                    <span className="truncate">{option.product.name}</span>
                    <span className="shrink-0 text-xs text-gray-500">
                        {formatPeso(option.product.unitPrice)} / {option.product.unit}
                    </span>
                </div>
            )}
        />
    )
}
