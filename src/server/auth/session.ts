import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/server/supabase/server'
import { ORGANIZATION_COOKIE } from '@/constants/app.constant'
import type { Membership, SessionUser } from '@/@types/auth/SessionUser'
import type { OrganizationMeta } from '@/@types/organizations/OrganizationMeta'
import type { Role } from '@/constants/roles.constant'

interface MembershipRow {
    role: Role
    organizations: {
        id: string
        registered_name: string
        business_name: string | null
        tin: string
        vat_registration: OrganizationMeta['vatRegistration']
    } | null
}

/**
 * The signed-in user, their active memberships and the organization this request works in (from the
 * `org` cookie, falling back to the first membership). Cached for the duration of one request.
 */
export const getServerSessionUser = cache(async (): Promise<SessionUser | null> => {
    const supabase = await createServerSupabase()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const [{ data: profile }, { data: memberships }] = await Promise.all([
        supabase.from('profiles').select('full_name, email, password_changed_at').eq('id', user.id).maybeSingle(),
        supabase
            .from('organization_members')
            .select('role, organizations(id, registered_name, business_name, tin, vat_registration)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at')
            .returns<MembershipRow[]>(),
    ])

    const items: Membership[] = (memberships ?? [])
        .filter((row) => row.organizations)
        .map((row) => ({
            role: row.role,
            organization: {
                id: row.organizations!.id,
                registeredName: row.organizations!.registered_name,
                businessName: row.organizations!.business_name,
                tin: row.organizations!.tin,
                vatRegistration: row.organizations!.vat_registration,
            },
        }))

    const selectedId = (await cookies()).get(ORGANIZATION_COOKIE)?.value
    const current = items.find((item) => item.organization.id === selectedId) ?? items[0] ?? null

    return {
        id: user.id,
        email: user.email ?? profile?.email ?? '',
        fullName: profile?.full_name || (user.user_metadata?.full_name as string | undefined) || user.email || '',
        organization: current?.organization ?? null,
        role: current?.role ?? null,
        memberships: items,
        passwordChangedAt: profile?.password_changed_at ?? null,
    }
})
