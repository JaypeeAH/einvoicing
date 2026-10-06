import type { DocumentCategory } from '@/constants/bir.constant'

/** A file kept for BIR (COR, sworn statements, permits). Stored privately in Supabase Storage. */
export interface ComplianceDocument {
    id: string
    organizationId: string
    category: DocumentCategory
    title: string
    fileName: string
    mimeType: string
    fileSize: number
    uploadedByName: string | null
    createdAt: string
}
