import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import type { Collection } from '@/@types/collections'
import type { Product } from '@/@types/products/Product'
import type { ProductPayload } from '@/@types/products/forms/ProductFormData'
import { toSearchPattern } from '@/server/routes/api'

interface ProductRow {
    id: string
    organization_id: string
    sku: string | null
    name: string
    description: string | null
    unit: string
    unit_price: number | string
    tax_treatment: Product['taxTreatment']
    is_service: boolean
    is_active: boolean
    created_at: string
    updated_at: string
}

const toProduct = (row: ProductRow): Product => ({
    id: row.id,
    organizationId: row.organization_id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    taxTreatment: row.tax_treatment,
    isService: row.is_service,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
})

const toRow = (payload: ProductPayload) => ({
    sku: payload.sku,
    name: payload.name,
    description: payload.description,
    unit: payload.unit,
    unit_price: payload.unitPrice,
    tax_treatment: payload.taxTreatment,
    is_service: payload.isService,
    is_active: payload.isActive,
})

export const listProducts = async (
    supabase: ServerSupabase,
    organizationId: string,
    params: { query?: string; active?: boolean; from: number; to: number },
): Promise<Collection<Product>> => {
    let request = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('name')
        .range(params.from, params.to)
    if (params.query) {
        const pattern = toSearchPattern(params.query)
        request = request.or(`name.ilike.${pattern},sku.ilike.${pattern},description.ilike.${pattern}`)
    }
    if (params.active !== undefined) request = request.eq('is_active', params.active)

    const { data, error, count } = await request.returns<ProductRow[]>()
    if (error) throw error
    return { total: count ?? 0, records: data.map(toProduct) }
}

export const createProduct = async (supabase: ServerSupabase, organizationId: string, payload: ProductPayload) => {
    const { data, error } = await supabase
        .from('products')
        .insert({ ...toRow(payload), organization_id: organizationId })
        .select('*')
        .single<ProductRow>()
    if (error) throw error
    return toProduct(data)
}

export const updateProduct = async (
    supabase: ServerSupabase,
    organizationId: string,
    productId: string,
    payload: ProductPayload,
) => {
    const { data, error } = await supabase
        .from('products')
        .update(toRow(payload))
        .eq('id', productId)
        .eq('organization_id', organizationId)
        .select('*')
        .single<ProductRow>()
    if (error) throw error
    return toProduct(data)
}

export const deleteProduct = async (supabase: ServerSupabase, organizationId: string, productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId).eq('organization_id', organizationId)
    if (error) throw error
}
