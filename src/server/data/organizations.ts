import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import type { Organization } from '@/@types/organizations/Organization'
import type {
    OrganizationPayload,
    OrganizationSettingsPayload,
} from '@/@types/organizations/forms/OrganizationFormData'
import { NotFoundError } from '@/@types/errors'

export interface OrganizationRow {
    id: string
    registered_name: string
    business_name: string | null
    tin: string
    vat_registration: Organization['vatRegistration']
    taxpayer_size: Organization['taxpayerSize']
    rdo_code: string
    registered_address: string
    zip_code: string
    line_of_business: string | null
    email: string | null
    phone: string | null
    prices_include_vat: boolean
    eis_transmission_enabled: boolean
    created_at: string
    updated_at: string
}

export const toOrganization = (row: OrganizationRow): Organization => ({
    id: row.id,
    registeredName: row.registered_name,
    businessName: row.business_name,
    tin: row.tin,
    vatRegistration: row.vat_registration,
    taxpayerSize: row.taxpayer_size,
    rdoCode: row.rdo_code,
    registeredAddress: row.registered_address,
    zipCode: row.zip_code,
    lineOfBusiness: row.line_of_business,
    email: row.email,
    phone: row.phone,
    pricesIncludeVat: row.prices_include_vat,
    eisTransmissionEnabled: row.eis_transmission_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
})

export const getOrganization = async (supabase: ServerSupabase, organizationId: string) => {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .maybeSingle<OrganizationRow>()
    if (error) throw error
    if (!data) throw new NotFoundError('Organization not found.')
    return toOrganization(data)
}

export const updateOrganization = async (
    supabase: ServerSupabase,
    organizationId: string,
    payload: OrganizationSettingsPayload,
) => {
    const { data, error } = await supabase
        .from('organizations')
        .update({
            registered_name: payload.registeredName,
            business_name: payload.businessName || null,
            tin: payload.tin,
            vat_registration: payload.vatRegistration,
            taxpayer_size: payload.taxpayerSize,
            rdo_code: payload.rdoCode.toUpperCase(),
            registered_address: payload.registeredAddress,
            zip_code: payload.zipCode,
            line_of_business: payload.lineOfBusiness || null,
            email: payload.email || null,
            phone: payload.phone || null,
            prices_include_vat: payload.pricesIncludeVat,
            eis_transmission_enabled: payload.eisTransmissionEnabled,
        })
        .eq('id', organizationId)
        .select('*')
        .single<OrganizationRow>()
    if (error) throw error
    return toOrganization(data)
}

/** Onboarding: creates the organization, its head office and makes the caller the owner. */
export const createOrganization = async (supabase: ServerSupabase, payload: OrganizationPayload) => {
    const { data, error } = await supabase.rpc('create_organization', {
        p_registered_name: payload.registeredName,
        p_business_name: payload.businessName || null,
        p_tin: payload.tin,
        p_vat_registration: payload.vatRegistration,
        p_taxpayer_size: payload.taxpayerSize,
        p_rdo_code: payload.rdoCode,
        p_registered_address: payload.registeredAddress,
        p_zip_code: payload.zipCode,
        p_line_of_business: payload.lineOfBusiness || null,
        p_email: payload.email || null,
        p_phone: payload.phone || null,
        p_prices_include_vat: payload.pricesIncludeVat,
    })
    if (error) throw error
    return data as string
}
