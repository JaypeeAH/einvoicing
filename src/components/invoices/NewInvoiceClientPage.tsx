'use client'

import Link from 'next/link'
import Alert from '@/components/ui/Alert'
import Loading from '@/components/shared/Loading'
import InvoiceEditor from '@/components/invoices/forms/InvoiceEditor'
import { useOrganizationStore } from '@/stores/OrganizationStore'
import { useBranchesStore } from '@/stores/BranchesStore'
import { useSeriesStore } from '@/stores/SeriesStore'
import { useSWRInvoice } from '@/services/invoices'
import { useSetBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { getMemoDefaults, getNewInvoiceDefaults } from '@/utils/invoices/invoiceFormData'
import { tryGetErrorMessage } from '@/utils/errors'
import { DOCUMENT_TYPE_LABELS, isMemoDocumentType, type DocumentType } from '@/constants/bir.constant'
import { branchesPath, getInvoicePath, invoicesPath } from '@/configs/app.config'

interface NewInvoiceClientPageProps {
    documentType: DocumentType
    /** Credit/debit memos: the issued invoice being adjusted. */
    referenceId: string | null
}

/** Starts a new invoice or memo once the organization, branches and series have loaded. */
export default function NewInvoiceClientPage({ documentType, referenceId }: NewInvoiceClientPageProps) {
    const organization = useOrganizationStore((state) => state.data)
    const branches = useBranchesStore((state) => state.data)
    const seriesLoading = useSeriesStore((state) => state.loading)
    const organizationError = useOrganizationStore((state) => state.error)
    const branchesError = useBranchesStore((state) => state.error)
    const loadError = organizationError || branchesError
    const reference = useSWRInvoice(isMemoDocumentType(documentType) ? referenceId : null)

    useSetBreadcrumbs([
        { label: 'Invoices & Memos', href: invoicesPath },
        { label: `New ${DOCUMENT_TYPE_LABELS[documentType]}` },
    ])

    if (loadError || reference.error) {
        return (
            <Alert type="danger" showIcon duration={0}>
                {loadError ?? tryGetErrorMessage(reference.error)}
            </Alert>
        )
    }

    const waitingForReference = isMemoDocumentType(documentType) && !!referenceId && !reference.data
    if (!organization || !branches || seriesLoading || waitingForReference) {
        return <Loading loading type="default" />
    }

    const activeBranches = branches.filter((branch) => branch.status === 'active')
    if (activeBranches.length === 0) {
        return (
            <Alert type="warning" showIcon duration={0}>
                There is no active branch. <Link href={branchesPath}>Add or re-open a branch</Link> first.
            </Alert>
        )
    }

    if (reference.data && reference.data.status !== 'issued') {
        return (
            <Alert type="warning" showIcon duration={0}>
                Only issued invoices can be adjusted.{' '}
                <Link href={getInvoicePath(reference.data.id)} className="underline">
                    Back to the invoice
                </Link>
            </Alert>
        )
    }

    const headOffice = activeBranches.find((branch) => branch.isHeadOffice) ?? activeBranches[0]
    const defaultValues = reference.data
        ? getMemoDefaults(reference.data, documentType)
        : getNewInvoiceDefaults({
              documentType,
              branchId: headOffice.id,
              pricesIncludeVat: organization.vatRegistration === 'vat' && organization.pricesIncludeVat,
              taxTreatment: organization.vatRegistration === 'vat' ? 'vatable' : 'non_vat',
          })

    return (
        <InvoiceEditor
            defaultValues={defaultValues}
            initialReference={
                reference.data
                    ? {
                          id: reference.data.id,
                          invoiceNumber: reference.data.invoiceNumber,
                          invoiceDate: reference.data.invoiceDate,
                          documentType: reference.data.documentType,
                          totalAmount: reference.data.totalAmount,
                          buyerName: reference.data.buyerName,
                      }
                    : null
            }
        />
    )
}
