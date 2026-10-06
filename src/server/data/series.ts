import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import type { DocumentSeries } from '@/@types/series/DocumentSeries'
import type { DocumentSeriesPayload } from '@/@types/series/forms/DocumentSeriesFormData'

interface SeriesRow {
    id: string
    organization_id: string
    branch_id: string
    document_type: DocumentSeries['documentType']
    prefix: string
    start_number: number
    end_number: number
    next_number: number
    padding: number
    ac_number: string
    ac_date: string
    is_active: boolean
    created_at: string
    updated_at: string
    branches: { code: string; name: string } | null
}

const SELECT = '*, branches(code, name)'

const toSeries = (row: SeriesRow): DocumentSeries => ({
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    branchCode: row.branches?.code ?? '',
    branchName: row.branches?.name ?? '',
    documentType: row.document_type,
    prefix: row.prefix,
    startNumber: Number(row.start_number),
    endNumber: Number(row.end_number),
    nextNumber: Number(row.next_number),
    padding: row.padding,
    acNumber: row.ac_number,
    acDate: row.ac_date,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
})

const toRow = (payload: DocumentSeriesPayload) => ({
    branch_id: payload.branchId,
    document_type: payload.documentType,
    prefix: payload.prefix.toUpperCase(),
    start_number: payload.startNumber,
    end_number: payload.endNumber,
    padding: payload.padding,
    ac_number: payload.acNumber,
    ac_date: payload.acDate,
    is_active: payload.isActive,
})

export const listSeries = async (supabase: ServerSupabase, organizationId: string) => {
    const { data, error } = await supabase
        .from('document_series')
        .select(SELECT)
        .eq('organization_id', organizationId)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false })
        .returns<SeriesRow[]>()
    if (error) throw error
    return data.map(toSeries)
}

export const createSeries = async (
    supabase: ServerSupabase,
    organizationId: string,
    payload: DocumentSeriesPayload,
) => {
    const { data, error } = await supabase
        .from('document_series')
        .insert({ ...toRow(payload), organization_id: organizationId, next_number: payload.startNumber })
        .select(SELECT)
        .single<SeriesRow>()
    if (error) throw error
    return toSeries(data)
}

/** Unused series can be corrected; once a number is used only `isActive` can change (enforced by the DB). */
export const updateSeries = async (
    supabase: ServerSupabase,
    organizationId: string,
    seriesId: string,
    payload: DocumentSeriesPayload,
) => {
    const { data: current, error: readError } = await supabase
        .from('document_series')
        .select('start_number, next_number')
        .eq('id', seriesId)
        .eq('organization_id', organizationId)
        .single<{ start_number: number; next_number: number }>()
    if (readError) throw readError

    const used = Number(current.next_number) > Number(current.start_number)
    const update = used ? { is_active: payload.isActive } : { ...toRow(payload), next_number: payload.startNumber }

    const { data, error } = await supabase
        .from('document_series')
        .update(update)
        .eq('id', seriesId)
        .eq('organization_id', organizationId)
        .select(SELECT)
        .single<SeriesRow>()
    if (error) throw error
    return toSeries(data)
}
