import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import { getMemberNames } from '@/server/data/members'
import { complianceDocumentsBucket } from '@/configs/supabase.config'
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES } from '@/constants/app.constant'
import { DataError, NotFoundError } from '@/@types/errors'
import type { ComplianceDocument } from '@/@types/documents/ComplianceDocument'
import type { DocumentCategory } from '@/constants/bir.constant'

interface DocumentRow {
    id: string
    organization_id: string
    category: DocumentCategory
    title: string
    storage_path: string
    file_name: string
    mime_type: string
    file_size: number
    uploaded_by: string | null
    created_at: string
}

export const listDocuments = async (supabase: ServerSupabase, organizationId: string) => {
    const { data, error } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .returns<DocumentRow[]>()
    if (error) throw error
    const names = await getMemberNames(
        supabase,
        organizationId,
        data.map((row) => row.uploaded_by).filter((id): id is string => !!id),
    )
    return data.map((row): ComplianceDocument => ({
        id: row.id,
        organizationId: row.organization_id,
        category: row.category,
        title: row.title,
        fileName: row.file_name,
        mimeType: row.mime_type,
        fileSize: Number(row.file_size),
        uploadedByName: row.uploaded_by ? (names.get(row.uploaded_by) ?? null) : null,
        createdAt: row.created_at,
    }))
}

/** Uploads to private storage under `<organization id>/` and records the document. */
export const uploadDocument = async (
    supabase: ServerSupabase,
    organizationId: string,
    input: { category: DocumentCategory; title: string; file: File },
) => {
    if (!ALLOWED_DOCUMENT_TYPES.includes(input.file.type)) {
        throw new DataError('Upload a PDF, PNG or JPEG file.')
    }
    if (input.file.size === 0 || input.file.size > MAX_DOCUMENT_BYTES) {
        throw new DataError('Files must be smaller than 10 MB.')
    }

    const safeName = input.file.name.replace(/[^\w.\-]/g, '_').slice(-100)
    const storagePath = `${organizationId}/${crypto.randomUUID()}-${safeName}`

    const { error: uploadError } = await supabase.storage
        .from(complianceDocumentsBucket)
        .upload(storagePath, input.file, { contentType: input.file.type, upsert: false })
    if (uploadError) throw new DataError(uploadError.message)

    const { error } = await supabase.from('compliance_documents').insert({
        organization_id: organizationId,
        category: input.category,
        title: input.title,
        storage_path: storagePath,
        file_name: input.file.name,
        mime_type: input.file.type,
        file_size: input.file.size,
    })
    if (error) {
        await supabase.storage.from(complianceDocumentsBucket).remove([storagePath])
        throw error
    }
}

/** Short-lived signed URL for downloading a private document. */
export const getDocumentDownloadUrl = async (supabase: ServerSupabase, organizationId: string, documentId: string) => {
    const { data: row, error } = await supabase
        .from('compliance_documents')
        .select('storage_path, file_name, title')
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .maybeSingle<{ storage_path: string; file_name: string; title: string }>()
    if (error) throw error
    if (!row) throw new NotFoundError('Document not found.')

    const { data, error: signError } = await supabase.storage
        .from(complianceDocumentsBucket)
        .createSignedUrl(row.storage_path, 60, { download: row.file_name })
    if (signError) throw new DataError(signError.message)

    await supabase.rpc('log_audit_event', {
        p_organization_id: organizationId,
        p_action: 'download',
        p_entity_type: 'compliance_documents',
        p_entity_id: documentId,
        p_summary: `Downloaded document: ${row.title}`,
    })
    return data.signedUrl
}

export const deleteDocument = async (supabase: ServerSupabase, organizationId: string, documentId: string) => {
    const { data: row, error } = await supabase
        .from('compliance_documents')
        .delete()
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .select('storage_path')
        .maybeSingle<{ storage_path: string }>()
    if (error) throw error
    if (!row) throw new NotFoundError('Document not found.')
    await supabase.storage.from(complianceDocumentsBucket).remove([row.storage_path])
}
