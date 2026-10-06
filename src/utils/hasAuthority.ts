import { ROLE_PERMISSIONS } from '@/constants/permissions.constant'
import type { Action } from '@/constants/actions.constant'
import type { Role } from '@/constants/roles.constant'

/** True when `role` may perform `action`. */
export const hasAuthorityTo = (role: Role | null | undefined, action: Action) =>
    !!role && ROLE_PERMISSIONS[role].includes(action)

/** True when `role` may perform any of `actions` (an empty list means every member). */
export const hasAnyAuthority = (role: Role | null | undefined, actions: readonly Action[]) =>
    !!role && (actions.length === 0 || actions.some((action) => hasAuthorityTo(role, action)))
