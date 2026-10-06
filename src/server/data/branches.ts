import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import type { Branch } from '@/@types/branches/Branch'
import type { BranchFormData } from '@/@types/branches/forms/BranchFormData'

interface BranchRow {
    id: string
    organization_id: string
    code: string
    name: string
    address: string
    rdo_code: string
    is_head_office: boolean
    status: Branch['status']
    created_at: string
    updated_at: string
}

const toBranch = (row: BranchRow): Branch => ({
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    address: row.address,
    rdoCode: row.rdo_code,
    isHeadOffice: row.is_head_office,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
})

const toRow = (payload: BranchFormData) => ({
    code: payload.code,
    name: payload.name,
    address: payload.address,
    rdo_code: payload.rdoCode.toUpperCase(),
    status: payload.status,
})

export const listBranches = async (supabase: ServerSupabase, organizationId: string) => {
    const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', organizationId)
        .order('code')
        .returns<BranchRow[]>()
    if (error) throw error
    return data.map(toBranch)
}

export const createBranch = async (supabase: ServerSupabase, organizationId: string, payload: BranchFormData) => {
    const { data, error } = await supabase
        .from('branches')
        .insert({ ...toRow(payload), organization_id: organizationId, is_head_office: false })
        .select('*')
        .single<BranchRow>()
    if (error) throw error
    return toBranch(data)
}

export const updateBranch = async (
    supabase: ServerSupabase,
    organizationId: string,
    branchId: string,
    payload: BranchFormData,
) => {
    const { data, error } = await supabase
        .from('branches')
        .update(toRow(payload))
        .eq('id', branchId)
        .eq('organization_id', organizationId)
        .select('*')
        .single<BranchRow>()
    if (error) throw error
    return toBranch(data)
}
