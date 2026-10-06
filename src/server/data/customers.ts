import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import type { Collection } from '@/@types/collections'
import type { Customer } from '@/@types/customers/Customer'
import type { CustomerPayload } from '@/@types/customers/forms/CustomerFormData'
import { toSearchPattern } from '@/server/routes/api'

interface CustomerRow {
    id: string
    organization_id: string
    customer_type: Customer['customerType']
    registered_name: string
    business_name: string | null
    tin: string | null
    branch_code: string | null
    address: string | null
    email: string | null
    phone: string | null
    is_vat_registered: boolean
    is_active: boolean
    created_at: string
    updated_at: string
}

const toCustomer = (row: CustomerRow): Customer => ({
    id: row.id,
    organizationId: row.organization_id,
    customerType: row.customer_type,
    registeredName: row.registered_name,
    businessName: row.business_name,
    tin: row.tin,
    branchCode: row.branch_code,
    address: row.address,
    email: row.email,
    phone: row.phone,
    isVatRegistered: row.is_vat_registered,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
})

const toRow = (payload: CustomerPayload) => ({
    customer_type: payload.customerType,
    registered_name: payload.registeredName,
    business_name: payload.businessName,
    tin: payload.tin,
    branch_code: payload.branchCode,
    address: payload.address,
    email: payload.email,
    phone: payload.phone,
    is_vat_registered: payload.isVatRegistered,
    is_active: payload.isActive,
})

export const listCustomers = async (
    supabase: ServerSupabase,
    organizationId: string,
    params: { query?: string; active?: boolean; from: number; to: number },
): Promise<Collection<Customer>> => {
    let request = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('registered_name')
        .range(params.from, params.to)
    if (params.query) {
        const pattern = toSearchPattern(params.query)
        request = request.or(`registered_name.ilike.${pattern},business_name.ilike.${pattern},tin.ilike.${pattern}`)
    }
    if (params.active !== undefined) request = request.eq('is_active', params.active)

    const { data, error, count } = await request.returns<CustomerRow[]>()
    if (error) throw error
    return { total: count ?? 0, records: data.map(toCustomer) }
}

export const getCustomer = async (supabase: ServerSupabase, organizationId: string, customerId: string) => {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', organizationId)
        .single<CustomerRow>()
    if (error) throw error
    return toCustomer(data)
}

export const createCustomer = async (supabase: ServerSupabase, organizationId: string, payload: CustomerPayload) => {
    const { data, error } = await supabase
        .from('customers')
        .insert({ ...toRow(payload), organization_id: organizationId })
        .select('*')
        .single<CustomerRow>()
    if (error) throw error
    return toCustomer(data)
}

export const updateCustomer = async (
    supabase: ServerSupabase,
    organizationId: string,
    customerId: string,
    payload: CustomerPayload,
) => {
    const { data, error } = await supabase
        .from('customers')
        .update(toRow(payload))
        .eq('id', customerId)
        .eq('organization_id', organizationId)
        .select('*')
        .single<CustomerRow>()
    if (error) throw error
    return toCustomer(data)
}

/** Deletes a customer. Issued invoices keep their own copy of the buyer details. */
export const deleteCustomer = async (supabase: ServerSupabase, organizationId: string, customerId: string) => {
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('organization_id', organizationId)
    if (error) throw error
}
