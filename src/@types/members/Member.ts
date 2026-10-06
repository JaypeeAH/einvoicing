import type { Role } from '@/constants/roles.constant'

/** A user's membership in an organization. */
export interface Member {
    id: string
    organizationId: string
    userId: string
    email: string
    fullName: string
    role: Role
    status: 'active' | 'invited' | 'suspended'
    createdAt: string
    updatedAt: string
}
