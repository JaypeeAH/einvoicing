'use client'

import { useState } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import Spinner from '@/components/ui/Spinner'
import { toastError } from '@/components/ui/toast/toast'
import { useSessionStore } from '@/stores/SessionStore'
import { apiSwitchOrganization } from '@/services/session'
import { AddIcon, BuildingIcon, SelectorIcon, SuccessIcon } from '@/configs/icons.config'
import { onboardingPath } from '@/configs/app.config'
import { ROLE_LABELS } from '@/constants/roles.constant'
import { formatTinWithBranch } from '@/utils/tin'

/** Shows the current taxpayer (name + TIN) and switches between organizations the user belongs to. */
export default function OrganizationSwitcher() {
    const user = useSessionStore((state) => state.user)
    const [switching, setSwitching] = useState(false)

    if (!user?.organization) return null

    const onSwitch = async (organizationId: string) => {
        if (organizationId === user.organization?.id) return
        setSwitching(true)
        try {
            await apiSwitchOrganization(organizationId)
            // Full reload on purpose: every cached list and store belongs to the previous organization
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign('/')
        } catch (error) {
            setSwitching(false)
            toastError('Could not switch organization.', error)
        }
    }

    return (
        <Dropdown
            placement="bottom-end"
            renderTitle={
                <button
                    type="button"
                    className="flex max-w-[260px] items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <BuildingIcon className="shrink-0 text-xl text-primary" />
                    <span className="hidden min-w-0 sm:block">
                        <span className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {user.organization.businessName || user.organization.registeredName}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                            TIN {formatTinWithBranch(user.organization.tin, '00000')}
                        </span>
                    </span>
                    {switching ? <Spinner size={16} /> : <SelectorIcon className="shrink-0 text-gray-400" />}
                </button>
            }
        >
            <Dropdown.Item variant="header">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Organizations
                </div>
            </Dropdown.Item>
            {user.memberships.map((membership) => (
                <Dropdown.Item
                    key={membership.organization.id}
                    eventKey={membership.organization.id}
                    onClick={() => onSwitch(membership.organization.id)}
                >
                    <span className="flex w-full items-center justify-between gap-3">
                        <span className="min-w-0">
                            <span className="block truncate">{membership.organization.registeredName}</span>
                            <span className="block text-xs text-gray-500">{ROLE_LABELS[membership.role]}</span>
                        </span>
                        {membership.organization.id === user.organization?.id && (
                            <SuccessIcon className="shrink-0 text-lg text-primary" />
                        )}
                    </span>
                </Dropdown.Item>
            ))}
            <Dropdown.Item variant="divider" />
            <Dropdown.Item eventKey="new" onClick={() => window.location.assign(onboardingPath)}>
                <span className="flex items-center gap-2">
                    <AddIcon className="shrink-0 text-lg" /> Register another business
                </span>
            </Dropdown.Item>
        </Dropdown>
    )
}
