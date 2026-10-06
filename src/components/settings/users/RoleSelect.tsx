'use client'

import Select, { Option as SelectOption } from '@/components/ui/Select'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from '@/constants/roles.constant'
import type { OptionProps } from 'react-select'
import type { Option } from '@/@types/common'

/** Menu item with the role's description under its name. */
const RoleOption = (props: OptionProps<Option<Role>>) => (
    <SelectOption<Option<Role>>
        {...props}
        customLabel={(data) => (
            <div className="ml-2 py-1">
                <div className="font-semibold">{data.label}</div>
                <div className="text-xs whitespace-normal text-gray-500 dark:text-gray-400">
                    {ROLE_DESCRIPTIONS[data.value]}
                </div>
            </div>
        )}
    />
)

interface RoleSelectProps {
    roles: readonly Role[]
    value: Role | undefined
    onChange: (role: Role | undefined) => void
    onBlur?: () => void
}

/** Role picker that explains each role in the menu and below the field. */
export default function RoleSelect({ roles, value, onChange, onBlur }: RoleSelectProps) {
    const options: Option<Role>[] = roles.map((role) => ({ value: role, label: ROLE_LABELS[role] }))

    return (
        <>
            <Select<Option<Role>>
                options={options}
                value={options.find((option) => option.value === value) ?? null}
                onChange={(option) => onChange(option?.value)}
                onBlur={onBlur}
                isSearchable={false}
                placeholder="Select a role"
                components={{ Option: RoleOption }}
            />
            {value && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{ROLE_DESCRIPTIONS[value]}</p>}
        </>
    )
}
