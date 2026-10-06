import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import type { Registration } from '@/@types/registrations/Registration'
import type { RegistrationPayload } from '@/@types/registrations/forms/RegistrationFormData'

interface RegistrationRow {
    id: string
    organization_id: string
    registration_type: Registration['registrationType']
    status: Registration['status']
    reference_number: string | null
    rdo_code: string | null
    system_name: string | null
    system_version: string | null
    filed_on: string | null
    approved_on: string | null
    due_on: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

const toRegistration = (row: RegistrationRow): Registration => ({
    id: row.id,
    organizationId: row.organization_id,
    registrationType: row.registration_type,
    status: row.status,
    referenceNumber: row.reference_number,
    rdoCode: row.rdo_code,
    systemName: row.system_name,
    systemVersion: row.system_version,
    filedOn: row.filed_on,
    approvedOn: row.approved_on,
    dueOn: row.due_on,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
})

const toRow = (payload: RegistrationPayload) => ({
    registration_type: payload.registrationType,
    status: payload.status,
    reference_number: payload.referenceNumber,
    rdo_code: payload.rdoCode,
    system_name: payload.systemName,
    system_version: payload.systemVersion,
    filed_on: payload.filedOn,
    approved_on: payload.approvedOn,
    due_on: payload.dueOn,
    notes: payload.notes,
})

export const listRegistrations = async (supabase: ServerSupabase, organizationId: string) => {
    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .returns<RegistrationRow[]>()
    if (error) throw error
    return data.map(toRegistration)
}

export const createRegistration = async (
    supabase: ServerSupabase,
    organizationId: string,
    payload: RegistrationPayload,
) => {
    const { data, error } = await supabase
        .from('registrations')
        .insert({ ...toRow(payload), organization_id: organizationId })
        .select('*')
        .single<RegistrationRow>()
    if (error) throw error
    return toRegistration(data)
}

export const updateRegistration = async (
    supabase: ServerSupabase,
    organizationId: string,
    registrationId: string,
    payload: RegistrationPayload,
) => {
    const { data, error } = await supabase
        .from('registrations')
        .update(toRow(payload))
        .eq('id', registrationId)
        .eq('organization_id', organizationId)
        .select('*')
        .single<RegistrationRow>()
    if (error) throw error
    return toRegistration(data)
}

export const deleteRegistration = async (supabase: ServerSupabase, organizationId: string, registrationId: string) => {
    const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId)
        .eq('organization_id', organizationId)
    if (error) throw error
}
