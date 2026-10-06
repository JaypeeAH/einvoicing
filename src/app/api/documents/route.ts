import 'server-only'

import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { listDocuments, uploadDocument } from '@/server/data/documents'
import { ACTION_COMPLIANCE_MANAGE, ACTION_COMPLIANCE_VIEW } from '@/constants/actions.constant'
import { DOCUMENT_CATEGORIES, type DocumentCategory } from '@/constants/bir.constant'
import { DataError } from '@/@types/errors'

export const GET = apiAuthHandler(
    async (_req, _ctx, { supabase, organizationId }) => getJsonResponse(await listDocuments(supabase, organizationId)),
    { action: ACTION_COMPLIANCE_VIEW },
)

/** Multipart upload: fields `file`, `category`, `title`. */
export const POST = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const form = await req.formData()
        const file = form.get('file')
        const category = String(form.get('category') || '')
        const title = String(form.get('title') || '').trim()
        if (!(file instanceof File)) throw new DataError('Choose a file to upload.')
        if (!(DOCUMENT_CATEGORIES as readonly string[]).includes(category)) throw new DataError('Select a category.')
        if (title.length < 2) throw new DataError('Enter a title for the document.')
        await uploadDocument(supabase, organizationId, { file, category: category as DocumentCategory, title })
        return getJsonResponse(await listDocuments(supabase, organizationId), { status: 201 })
    },
    { action: ACTION_COMPLIANCE_MANAGE },
)
