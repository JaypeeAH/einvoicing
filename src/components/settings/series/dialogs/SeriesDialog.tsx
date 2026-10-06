'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import SeriesForm from '@/components/settings/series/forms/SeriesForm'
import { apiCreateSeries, apiUpdateSeries } from '@/services/series'
import type { Branch } from '@/@types/branches/Branch'
import type { DocumentSeries } from '@/@types/series/DocumentSeries'
import type { DocumentSeriesFormData } from '@/@types/series/forms/DocumentSeriesFormData'

interface SeriesDialogProps {
    isOpen: boolean
    series?: DocumentSeries | null
    branches: Branch[]
    allSeries: DocumentSeries[]
    onClose: () => void
    onSaved: (series: DocumentSeries) => void
}

const FORM_ID = 'series-form'

/** Register a new invoice series or edit an existing one. */
export default function SeriesDialog({ isOpen, series, branches, allSeries, onClose, onSaved }: SeriesDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: DocumentSeriesFormData) => {
        setSaving(true)
        try {
            const saved = series ? await apiUpdateSeries(series.id, data) : await apiCreateSeries(data)
            toastSuccess(series ? 'Invoice series updated.' : 'Invoice series registered.')
            onSaved(saved)
        } catch (error) {
            toastError('Could not save the invoice series.', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} width={680} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">{series ? 'Edit invoice series' : 'Register invoice series'}</h4>
            <p className="mb-5 text-gray-500 dark:text-gray-400">
                Copy the range exactly as approved on your CAS Acknowledgment Certificate.
            </p>
            {isOpen && (
                <SeriesForm
                    key={series?.id ?? 'new'}
                    id={FORM_ID}
                    series={series}
                    branches={branches}
                    allSeries={allSeries}
                    onSubmit={onSubmit}
                />
            )}
            <div className="mt-6 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    {series ? 'Save changes' : 'Register series'}
                </Button>
            </div>
        </Dialog>
    )
}
