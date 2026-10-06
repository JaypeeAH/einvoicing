import type { Role } from '@/constants/roles.constant'
import type { OrganizationMeta } from '@/@types/organizations/OrganizationMeta'

/** The signed-in user and the organization they are working in. */
export interface SessionUser {
    id: string
    email: string
    fullName: string
    /** Organization the request is scoped to (null before onboarding). */
    organization: OrganizationMeta | null
    /** Role in `organization` (null before onboarding). */
    role: Role | null
    /** Every organization the user can switch to. */
    memberships: Membership[]
    /** When the password was last changed (CAS rule: rotate every 30 days). */
    passwordChangedAt: string | null
}

export interface Membership {
    organization: OrganizationMeta
    role: Role
}
