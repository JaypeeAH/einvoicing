'use client'

import { useMemo, useState } from 'react'
import Select from '@/components/ui/Select'
import { useSWRCustomers } from '@/services/customers'
import useDebounce from '@/utils/hooks/useDebounce'
import { formatTinWithBranch } from '@/utils/tin'
import type { Customer } from '@/@types/customers/Customer'
import type { CustomerMeta } from '@/@types/customers/CustomerMeta'

interface CustomerOption {
    value: string
    label: string
    /** Full record for search results; absent for the pre-selected value. */
    customer?: Customer
}

interface CustomerSelectProps {
    id?: string
    /** The selected customer (kept by the parent so it shows even when not in the current search page). */
    value: CustomerMeta | null
    onChange: (customer: Customer | null) => void
    invalid?: boolean
    placeholder?: string
    isDisabled?: boolean
}

const toOption = (customer: Customer): CustomerOption => ({
    value: customer.id,
    label: customer.registeredName,
    customer,
})

const toValueOption = (customer: CustomerMeta): CustomerOption => ({
    value: customer.id,
    label: customer.registeredName,
})

/** Searchable customer picker (name or TIN), searching on the server as the user types. */
export default function CustomerSelect({ id, value, onChange, invalid, placeholder, isDisabled }: CustomerSelectProps) {
    const [input, setInput] = useState('')
    const query = useDebounce(input.trim(), 300)
    const { data, isLoading, error } = useSWRCustomers({ query, size: 20, active: true })

    const options = useMemo(() => (data?.records ?? []).map(toOption), [data])

    return (
        <Select<CustomerOption>
            inputId={id}
            options={options}
            value={value ? toValueOption(value) : null}
            onChange={(option) => onChange(option?.customer ?? null)}
            onInputChange={(text, meta) => {
                if (meta.action === 'input-change') setInput(text)
            }}
            filterOption={null}
            invalid={invalid}
            isDisabled={isDisabled}
            isLoading={isLoading}
            isClearable
            placeholder={error ? 'Customers could not be loaded' : (placeholder ?? 'Search customers by name or TIN…')}
            noOptionsMessage={() => (query ? 'No matching customers' : 'No customers yet')}
            formatOptionLabel={(option, meta) =>
                meta.context === 'menu' && option.customer ? (
                    <div>
                        <div className="font-semibold">{option.customer.registeredName}</div>
                        <div className="text-xs text-gray-500">
                            {[
                                formatTinWithBranch(option.customer.tin, option.customer.branchCode),
                                option.customer.businessName,
                            ]
                                .filter(Boolean)
                                .join(' · ') || 'No TIN'}
                        </div>
                    </div>
                ) : (
                    option.label
                )
            }
        />
    )
}
