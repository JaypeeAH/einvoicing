'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import DataTable, { type DataTableColumn } from '@/components/shared/DataTable'
import EmptyState from '@/components/shared/EmptyState'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import DocumentUploadDialog from '@/components/documents/dialogs/DocumentUploadDialog'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { apiDeleteDocument, apiGetDocumentDownloadUrl } from '@/services/documents'
import useAuthority from '@/utils/hooks/useAuthority'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { formatDate } from '@/utils/date'
import { formatFileSize } from '@/utils/fileSize'
import classNames from '@/utils/classNames'
import { ACTION_COMPLIANCE_MANAGE, ACTION_SETTINGS_MANAGE } from '@/constants/actions.constant'
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from '@/constants/bir.constant'
import { compliancePath } from '@/configs/app.config'
import { DeleteIcon, DocumentsNavIcon, DownloadIcon, SuccessIcon, UploadIcon } from '@/configs/icons.config'
import type { ComplianceDocument } from '@/@types/documents/ComplianceDocument'

const SUGGESTED: { category: DocumentCategory; label: string }[] = [
    { category: 'cor', label: 'Certificate of Registration (BIR Form 2303)' },
    { category: 'cas_ac', label: 'CAS Acknowledgment Certificate' },
    { category: 'sworn_statement', label: 'Joint Sworn Statement' },
    { category: 'pti', label: 'Permit to Issue (PTI)' },
    { category: 'eis_certification', label: 'EIS certificate' },
]

/** BIR documents kept on file (COR, sworn statements, permits): upload, download and delete. */
export default function DocumentsClientPage() {
    useSetBreadcrumbs([{ label: 'BIR Compliance', href: compliancePath }, { label: 'Documents' }])

    const { data, loading, error, refresh } = useDocumentsStore()
    const canUpload = useAuthority(ACTION_COMPLIANCE_MANAGE)
    const canDelete = useAuthority(ACTION_SETTINGS_MANAGE)

    const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<ComplianceDocument | null>(null)
    const [deletingBusy, setDeletingBusy] = useState(false)

    const documents = data ?? []
    const hasCategory = (category: DocumentCategory) => documents.some((item) => item.category === category)

    const onDownload = async (item: ComplianceDocument) => {
        setDownloadingId(item.id)
        try {
            const { url } = await apiGetDocumentDownloadUrl(item.id)
            window.open(url, '_blank', 'noopener,noreferrer')
        } catch (error) {
            toastError('Could not open the document.', error)
        } finally {
            setDownloadingId(null)
        }
    }

    const onDelete = async () => {
        if (!deleting) return
        setDeletingBusy(true)
        try {
            await apiDeleteDocument(deleting.id)
            toastSuccess('Document deleted.')
            setDeleting(null)
            refresh()
        } catch (error) {
            toastError('Could not delete the document.', error)
        } finally {
            setDeletingBusy(false)
        }
    }

    const columns: DataTableColumn<ComplianceDocument>[] = [
        {
            key: 'title',
            header: 'Document',
            cell: (row) => (
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{row.title}</div>
                    <div className="text-xs text-gray-500 md:hidden">{DOCUMENT_CATEGORY_LABELS[row.category]}</div>
                </div>
            ),
        },
        { key: 'category', header: 'Category', cell: (row) => DOCUMENT_CATEGORY_LABELS[row.category], hideBelow: 'md' },
        {
            key: 'file',
            header: 'File',
            cell: (row) => <span className="break-all">{row.fileName}</span>,
            hideBelow: 'lg',
        },
        { key: 'size', header: 'Size', cell: (row) => formatFileSize(row.fileSize), hideBelow: 'lg' },
        { key: 'uploadedBy', header: 'Uploaded by', cell: (row) => row.uploadedByName || '—', hideBelow: 'md' },
        {
            key: 'date',
            header: 'Date',
            cell: (row) => <span className="whitespace-nowrap">{formatDate(row.createdAt)}</span>,
            hideBelow: 'sm',
        },
        {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (row) => (
                <div className="flex justify-end gap-1">
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<DownloadIcon />}
                        aria-label="Download"
                        loading={downloadingId === row.id}
                        onClick={() => onDownload(row)}
                    />
                    {canDelete && (
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<DeleteIcon />}
                            aria-label="Delete"
                            className="hover:text-error"
                            onClick={() => setDeleting(row)}
                        />
                    )}
                </div>
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Documents"
                description="Keep copies of your BIR registrations and permits in one place, ready for your RDO or an audit."
                actions={
                    canUpload && (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<UploadIcon />}
                            onClick={() => setUploadCategory('cor')}
                        >
                            Upload
                        </Button>
                    )
                }
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <DataTable
                        columns={columns}
                        records={documents}
                        rowKey={(row) => row.id}
                        loading={loading}
                        error={error}
                        empty={
                            <EmptyState
                                icon={<DocumentsNavIcon />}
                                title="No documents yet"
                                description="Start with your Certificate of Registration (BIR Form 2303)."
                                action={
                                    canUpload && (
                                        <Button
                                            size="sm"
                                            variant="solid"
                                            icon={<UploadIcon />}
                                            onClick={() => setUploadCategory('cor')}
                                        >
                                            Upload your COR
                                        </Button>
                                    )
                                }
                            />
                        }
                    />
                </Card>

                <Card header={{ content: 'Documents to keep' }}>
                    <p className="mb-3 text-sm text-gray-500">
                        Keep these on file. BIR may ask for them during registration or an audit.
                    </p>
                    <ul className="flex flex-col gap-2">
                        {SUGGESTED.map((item) => {
                            const uploaded = hasCategory(item.category)
                            return (
                                <li key={item.category} className="flex items-center gap-3">
                                    <SuccessIcon
                                        className={classNames(
                                            'shrink-0 text-xl',
                                            uploaded ? 'text-success' : 'text-gray-300 dark:text-gray-600',
                                        )}
                                        aria-label={uploaded ? 'Uploaded' : 'Not uploaded yet'}
                                    />
                                    <span
                                        className={classNames(
                                            'min-w-0 flex-auto text-sm',
                                            uploaded
                                                ? 'text-gray-500'
                                                : 'font-semibold text-gray-800 dark:text-gray-100',
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                    {canUpload && !uploaded && (
                                        <Button
                                            size="xs"
                                            variant="plain"
                                            onClick={() => setUploadCategory(item.category)}
                                        >
                                            Upload
                                        </Button>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </Card>
            </div>

            <DocumentUploadDialog
                isOpen={!!uploadCategory}
                defaultCategory={uploadCategory ?? undefined}
                onClose={() => setUploadCategory(null)}
                onUploaded={() => {
                    setUploadCategory(null)
                    refresh()
                }}
            />
            <ConfirmDialog
                isOpen={!!deleting}
                type="danger"
                title="Delete this document?"
                confirmText="Delete"
                onClose={() => setDeleting(null)}
                onConfirm={onDelete}
                closable={!deletingBusy}
                confirmButtonProps={{ loading: deletingBusy }}
            >
                <strong>{deleting?.title}</strong> ({deleting?.fileName}) will be permanently removed. Keep BIR
                documents for at least 5 years.
            </ConfirmDialog>
        </>
    )
}
