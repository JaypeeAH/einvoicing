import dayjs from 'dayjs'
import {
    EIS_CERTIFICATION_MONTHS_AFTER_PTI,
    type DocumentCategory,
    type RegistrationType,
} from '@/constants/bir.constant'
import type { Branch } from '@/@types/branches/Branch'
import type { ChecklistItem } from '@/@types/compliance/ComplianceStatus'
import type { CoverageAssessment } from '@/@types/compliance/CoverageAssessment'
import type { Organization } from '@/@types/organizations/Organization'
import type { Registration } from '@/@types/registrations/Registration'
import type { DocumentSeries } from '@/@types/series/DocumentSeries'

export interface ChecklistInput {
    organization: Organization
    branches: Branch[]
    series: DocumentSeries[]
    registrations: Registration[]
    documentCategories: DocumentCategory[]
    assessment: CoverageAssessment | null
    today: string
}

const findApproved = (registrations: Registration[], type: RegistrationType) =>
    registrations.find((registration) => registration.registrationType === type && registration.status === 'approved')

const findLatest = (registrations: Registration[], type: RegistrationType) =>
    registrations.find((registration) => registration.registrationType === type)

/** Step-by-step readiness list shown in the Compliance Center, in the order a taxpayer completes it. */
export const buildChecklist = (input: ChecklistInput): { checklist: ChecklistItem[]; score: number } => {
    const { organization, branches, series, registrations, documentCategories, assessment, today } = input
    const hasDocument = (category: DocumentCategory) => documentCategories.includes(category)

    const activeBranches = branches.filter((branch) => branch.status === 'active')
    const branchesWithoutSeries = activeBranches.filter(
        (branch) =>
            !series.some(
                (item) =>
                    item.branchId === branch.id &&
                    item.isActive &&
                    (item.documentType === 'sales_invoice' || item.documentType === 'service_invoice'),
            ),
    )

    const coverage = assessment?.result.status
    const eInvoicingApplies = coverage === 'required' || coverage === 'voluntary'

    const casAc = findApproved(registrations, 'cas_ac')
    const pti = findApproved(registrations, 'pti')
    const eisCert = findApproved(registrations, 'eis_certification')
    const ptt = findApproved(registrations, 'ptt')
    const ptiFiled = findLatest(registrations, 'pti')

    const eisDue = pti?.approvedOn ? dayjs(pti.approvedOn).add(EIS_CERTIFICATION_MONTHS_AFTER_PTI, 'month') : null

    const checklist: ChecklistItem[] = [
        {
            key: 'profile',
            title: 'Complete your taxpayer profile',
            description: 'Registered name, TIN, RDO and address exactly as they appear on your COR (Form 2303).',
            state: organization.tin && organization.rdoCode && organization.registeredAddress ? 'done' : 'action',
            href: '/settings/company',
            reference: 'NIRC Sec. 236',
        },
        {
            key: 'cor',
            title: 'Upload your Certificate of Registration',
            description: 'Keep a copy of BIR Form 2303 for the head office and each branch.',
            state: hasDocument('cor') ? 'done' : 'action',
            href: '/compliance/documents',
        },
        {
            key: 'assessment',
            title: 'Check if e-invoicing is required for you',
            description: 'Answer a few questions to see whether the December 31, 2026 deadline applies.',
            state: assessment ? 'done' : 'action',
            href: '/compliance',
            reference: 'RR 26-2025',
        },
        {
            key: 'series',
            title: 'Set up invoice serial numbers for every branch',
            description:
                branchesWithoutSeries.length > 0
                    ? `Missing for: ${branchesWithoutSeries.map((branch) => `${branch.code} ${branch.name}`).join(', ')}.`
                    : 'Each branch has its own registered invoice series.',
            state: branchesWithoutSeries.length === 0 && activeBranches.length > 0 ? 'done' : 'action',
            href: '/settings/series',
            reference: 'RMC 5-2021 Annex B',
        },
        {
            key: 'sworn_statement',
            title: 'Sign the sworn statement for this system',
            description:
                'File the Joint Sworn Statement (Annex A-2) signed by you and the system provider, with the system description and sample invoices.',
            state: hasDocument('sworn_statement') ? 'done' : 'action',
            href: '/compliance/documents',
            reference: 'RMC 5-2021',
        },
        {
            key: 'cas_ac',
            title: 'Register the system with your RDO (CAS Acknowledgment Certificate)',
            description: casAc
                ? `Acknowledgment Certificate ${casAc.referenceNumber ?? ''} approved.`
                : 'File the CAS registration checklist with your RDO. The Acknowledgment Certificate is issued within 3 working days.',
            state: casAc ? 'done' : 'action',
            href: '/compliance/registrations',
            reference: 'RMC 5-2021',
        },
        {
            key: 'pti',
            title: 'Get a Permit to Issue electronic invoices (PTI)',
            description: pti
                ? `PTI ${pti.referenceNumber ?? ''} approved — one PTI covers the head office and all branches.`
                : ptiFiled?.status === 'filed'
                  ? 'Filed — BIR decides within 20 working days.'
                  : 'Required before your first e-invoice. File with your RDO or LT office.',
            state: !eInvoicingApplies
                ? 'not_applicable'
                : pti
                  ? 'done'
                  : ptiFiled?.status === 'filed'
                    ? 'pending'
                    : 'action',
            href: '/compliance/registrations',
            reference: 'RMC 98-2026 Sec. IV.12',
        },
        {
            key: 'eis_certification',
            title: 'Complete EIS certification',
            description: eisCert
                ? 'EIS certification approved.'
                : eisDue
                  ? `${dayjs(today).isAfter(eisDue) ? 'Overdue since' : 'Due by'} ${eisDue.format('MMMM D, YYYY')} (6 months after the PTI) — or the PTI can be revoked.`
                  : 'Pass the mandatory tests at eis-cert.bir.gov.ph within 6 months of your PTI.',
            state: !eInvoicingApplies ? 'not_applicable' : eisCert ? 'done' : pti ? 'action' : 'pending',
            href: '/compliance/registrations',
            reference: 'RMC 98-2026 Sec. IV.15',
        },
        {
            key: 'ptt',
            title: 'Transmit invoices to the BIR EIS',
            description: ptt
                ? organization.eisTransmissionEnabled
                    ? 'Issued invoices are queued and transmitted within 3 calendar days.'
                    : 'You hold a Permit to Transmit — turn on EIS transmission in Company settings.'
                : 'Only required once BIR issues you a Permit to Transmit (PTT).',
            state: !ptt ? 'not_applicable' : organization.eisTransmissionEnabled ? 'done' : 'action',
            href: ptt && !organization.eisTransmissionEnabled ? '/settings/company' : '/compliance/transmissions',
            reference: 'RR 8-2022',
        },
    ]

    const applicable = checklist.filter((item) => item.state !== 'not_applicable')
    const done = applicable.filter((item) => item.state === 'done').length
    const score = applicable.length === 0 ? 0 : Math.round((done / applicable.length) * 100)

    return { checklist, score }
}
