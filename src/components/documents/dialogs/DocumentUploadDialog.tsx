'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import DocumentUploadForm from '@/components/documents/forms/DocumentUploadForm'
import { apiUploadDocument } from '@/services/documents'
import type { DocumentCategory } from '@/constants/bir.constant'
import type { DocumentUploadFormData } from '@/@types/documents/forms/DocumentUploadFormData'

interface DocumentUploadDialogProps {
    isOpen: boolean
    defaultCategory?: DocumentCategory
    onClose: () => void
    onUploaded: () => void
}

const FORM_ID = 'document-upload-form'

/** Uploads a compliance document to private storage. */
export default function DocumentUploadDialog({
    isOpen,
    defaultCategory,
    onClose,
    onUploaded,
}: DocumentUploadDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: DocumentUploadFormData & { file: File }) => {
        setSaving(true)
        try {
            await apiUploadDocument({ file: data.file, category: data.category, title: data.title })
            toastSuccess('Document uploaded.')
            onUploaded()
        } catch (error) {
            toastError('Could not upload the document.', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} width={560} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">Upload a document</h4>
            <p className="mb-5 text-gray-500">
                Files are stored privately and only members of your organization can open them.
            </p>
            {isOpen && (
                <DocumentUploadForm
                    key={defaultCategory ?? 'default'}
                    id={FORM_ID}
                    defaultCategory={defaultCategory}
                    onSubmit={onSubmit}
                />
            )}
            <div className="mt-6 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    Upload
                </Button>
            </div>
        </Dialog>
    )
}
