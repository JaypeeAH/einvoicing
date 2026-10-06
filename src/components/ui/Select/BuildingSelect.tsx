'use client'

import { useMemo } from 'react'
import Select from './Select'
import { useSWRBuildings } from '@/services/buildings'
import { SWR_ONCE_ONLY } from '@/configs/swr.config'
import type { Building } from '@/@types/buildings/Building'

interface BuildingOption {
    value: string
    label: string
    building: Building
}

interface BuildingSelectProps {
    id?: string
    value: string | undefined
    onChange: (buildingId: string, building: Building | undefined) => void
    onBlur?: () => void
    invalid?: boolean
    placeholder?: string
}

/** Searchable building picker (name, number, plan number or address). */
export default function BuildingSelect({ id, value, onChange, onBlur, invalid, placeholder }: BuildingSelectProps) {
    const { data, isLoading, error } = useSWRBuildings(SWR_ONCE_ONLY)

    const options = useMemo<BuildingOption[]>(
        () =>
            (data?.records ?? []).map((building) => ({
                value: building.id,
                label: [building.name, building.planNumber && `SP ${building.planNumber.replace(/^SP\s*/i, '')}`]
                    .filter(Boolean)
                    .join(' · '),
                building,
            })),
        [data],
    )

    return (
        <Select<BuildingOption>
            inputId={id}
            options={options}
            value={options.find((o) => o.value === value) ?? null}
            onChange={(option) => onChange(option?.value ?? '', option?.building)}
            onBlur={onBlur}
            invalid={invalid}
            isLoading={isLoading}
            isClearable
            placeholder={
                error
                    ? 'Buildings could not be loaded — refresh to try again'
                    : (placeholder ?? 'Search for a building…')
            }
            noOptionsMessage={() => 'No matching buildings'}
            filterOption={(option, input) => {
                const q = input.trim().toLowerCase()
                const b = option.data.building
                return (
                    !q || [b.name, b.number, b.code, b.planNumber, b.address].some((v) => v?.toLowerCase().includes(q))
                )
            }}
        />
    )
}
