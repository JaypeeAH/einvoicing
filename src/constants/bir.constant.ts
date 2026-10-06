// Philippine BIR invoicing rules used across the app. Every rule cites its source so it can be reviewed
// when regulations change. See docs/BIR-COMPLIANCE.md for the full requirement-to-feature mapping.

/** Standard VAT rate (NIRC Sec. 106/108). */
export const VAT_RATE = 0.12

/**
 * Non-VAT sellers must issue an invoice for sales above this amount, or when the buyer asks
 * (RR 7-2024 Sec. 6(A)). VAT-registered sellers issue an invoice for every sale.
 */
export const NON_VAT_INVOICE_THRESHOLD = 500

/**
 * Buyer name, address and TIN are mandatory for sales of PHP 1,000 or more to VAT-registered buyers
 * (RR 7-2024 Sec. 6(B)). The app asks for them on every B2B sale because an invoice without them
 * cannot support the buyer's input-tax claim.
 */
export const BUYER_DETAILS_THRESHOLD = 1000

/** Serial numbers must have at least 6 running digits with leading zeroes (RMC 5-2021 Annex B). */
export const MIN_SERIAL_DIGITS = 6

/** Books and records are kept for 5 years (RR 7-2024 Sec. 4, implementing EOPT Sec. 235). */
export const RECORD_RETENTION_YEARS = 5

/** EIS certification must be completed within 6 months of the PTI (RMC 98-2026 Sec. IV.15). */
export const EIS_CERTIFICATION_MONTHS_AFTER_PTI = 6

/** Once a Permit to Transmit is held, e-invoices are transmitted within 3 calendar days (RR 8-2022). */
export const EIS_TRANSMISSION_DAYS = 3

/** Deadline for covered taxpayers to issue e-invoices (RR 26-2025, RMC 98-2026). */
export const EINVOICING_DEADLINE = '2026-12-31'

/** CAS security standard: passwords rotated every 30 days (RMC 5-2021 Annex B item 11). */
export const PASSWORD_MAX_AGE_DAYS = 30

/** Printed on supplementary documents such as credit/debit memos (RR 7-2024). */
export const NOT_VALID_FOR_INPUT_TAX = 'THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX'

// ---------------------------------------------------------------------------------------------------------
// Document types
// ---------------------------------------------------------------------------------------------------------

export const DOCUMENT_TYPES = ['sales_invoice', 'service_invoice', 'credit_memo', 'debit_memo'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    sales_invoice: 'Sales Invoice',
    service_invoice: 'Service Invoice',
    credit_memo: 'Credit Memo',
    debit_memo: 'Debit Memo',
}

/** Invoices are the primary document; memos are supplementary documents that adjust an invoice. */
export const INVOICE_DOCUMENT_TYPES: DocumentType[] = ['sales_invoice', 'service_invoice']
export const MEMO_DOCUMENT_TYPES: DocumentType[] = ['credit_memo', 'debit_memo']

export const isMemoDocumentType = (type: DocumentType) => MEMO_DOCUMENT_TYPES.includes(type)

// ---------------------------------------------------------------------------------------------------------
// Invoice status
// ---------------------------------------------------------------------------------------------------------

export const INVOICE_STATUSES = ['draft', 'issued', 'voided'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    issued: 'Issued',
    voided: 'Voided',
}

// ---------------------------------------------------------------------------------------------------------
// Tax treatment of a line
// ---------------------------------------------------------------------------------------------------------

/**
 * - `vatable`, `zero_rated`, `vat_exempt` apply to VAT-registered sellers.
 * - `non_vat` is a non-VAT seller's sale subject to percentage tax; `vat_exempt` is an exempt sale.
 */
export const TAX_TREATMENTS = ['vatable', 'zero_rated', 'vat_exempt', 'non_vat'] as const
export type TaxTreatment = (typeof TAX_TREATMENTS)[number]

export const TAX_TREATMENT_LABELS: Record<TaxTreatment, string> = {
    vatable: 'VATable (12%)',
    zero_rated: 'Zero-rated (0%)',
    vat_exempt: 'VAT-exempt',
    non_vat: 'Non-VAT (percentage tax)',
}

export const VAT_SELLER_TREATMENTS: TaxTreatment[] = ['vatable', 'zero_rated', 'vat_exempt']
export const NON_VAT_SELLER_TREATMENTS: TaxTreatment[] = ['non_vat', 'vat_exempt']

// ---------------------------------------------------------------------------------------------------------
// Special (statutory) discounts. The discount is computed on the VAT-exclusive price and the sale becomes
// VAT-exempt (RA 9994, RA 10754, RA 11861, RA 10699, RA 9049). Solo parents get 10% on qualified items.
// ---------------------------------------------------------------------------------------------------------

export const SPECIAL_DISCOUNT_TYPES = ['senior_citizen', 'pwd', 'solo_parent', 'naac', 'mov'] as const
export type SpecialDiscountType = (typeof SPECIAL_DISCOUNT_TYPES)[number]

export const SPECIAL_DISCOUNTS: Record<SpecialDiscountType, { label: string; rate: number; idLabel: string }> = {
    senior_citizen: { label: 'Senior Citizen', rate: 0.2, idLabel: 'OSCA ID No.' },
    pwd: { label: 'Person with Disability', rate: 0.2, idLabel: 'PWD ID No.' },
    solo_parent: { label: 'Solo Parent', rate: 0.1, idLabel: 'Solo Parent ID No.' },
    naac: { label: 'National Athlete / Coach', rate: 0.2, idLabel: 'PNSTM ID No.' },
    mov: { label: 'Medal of Valor Awardee', rate: 0.2, idLabel: 'MOV ID No.' },
}

// ---------------------------------------------------------------------------------------------------------
// Taxpayer profile
// ---------------------------------------------------------------------------------------------------------

export const VAT_REGISTRATIONS = ['vat', 'non_vat'] as const
export type VatRegistration = (typeof VAT_REGISTRATIONS)[number]

export const VAT_REGISTRATION_LABELS: Record<VatRegistration, string> = {
    vat: 'VAT-registered',
    non_vat: 'Non-VAT registered',
}

/** EOPT taxpayer classification (RR 8-2024): micro < 3M, small 3M–20M, medium 20M–1B, large ≥ 1B gross sales. */
export const TAXPAYER_SIZES = ['micro', 'small', 'medium', 'large'] as const
export type TaxpayerSize = (typeof TAXPAYER_SIZES)[number]

export const TAXPAYER_SIZE_LABELS: Record<TaxpayerSize, string> = {
    micro: 'Micro (below ₱3M gross sales)',
    small: 'Small (₱3M to below ₱20M)',
    medium: 'Medium (₱20M to below ₱1B)',
    large: 'Large (₱1B and above)',
}

export const CUSTOMER_TYPES = ['business', 'individual', 'government'] as const
export type CustomerType = (typeof CUSTOMER_TYPES)[number]

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
    business: 'Business',
    individual: 'Individual',
    government: 'Government',
}

// ---------------------------------------------------------------------------------------------------------
// BIR registrations the taxpayer holds for this system
// ---------------------------------------------------------------------------------------------------------

export const REGISTRATION_TYPES = ['cor', 'cas_ac', 'pti', 'eis_certification', 'ptt'] as const
export type RegistrationType = (typeof REGISTRATION_TYPES)[number]

export const REGISTRATION_TYPE_INFO: Record<
    RegistrationType,
    { label: string; short: string; description: string; basis: string }
> = {
    cor: {
        label: 'Certificate of Registration (BIR Form 2303)',
        short: 'COR',
        description: 'Confirms the registered name, TIN, branch code, address and tax types printed on invoices.',
        basis: 'NIRC Sec. 236',
    },
    cas_ac: {
        label: 'CAS Acknowledgment Certificate',
        short: 'CAS AC',
        description:
            'Registration of this system as your Computerized Accounting System. Its control number (ACCN), date and approved series are printed on every invoice.',
        basis: 'RMC 5-2021',
    },
    pti: {
        label: 'Permit to Issue Electronic Invoices',
        short: 'PTI',
        description:
            'Required before issuing e-invoices. One PTI covers the head office and all branches using the same system.',
        basis: 'RMC 98-2026 Sec. IV.12–13',
    },
    eis_certification: {
        label: 'EIS Certification',
        short: 'EIS Cert',
        description:
            'Online certification at eis-cert.bir.gov.ph. Must be completed within 6 months of the PTI or the PTI can be revoked.',
        basis: 'RMC 98-2026 Sec. IV.15',
    },
    ptt: {
        label: 'Permit to Transmit',
        short: 'PTT',
        description:
            'Issued when BIR directs electronic sales reporting. Once held, e-invoices must be transmitted to the EIS within 3 calendar days.',
        basis: 'RR 8-2022; NIRC Sec. 237-A',
    },
}

export const REGISTRATION_STATUSES = ['not_started', 'preparing', 'filed', 'approved', 'rejected', 'revoked'] as const
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
    not_started: 'Not started',
    preparing: 'Preparing',
    filed: 'Filed with BIR',
    approved: 'Approved',
    rejected: 'Rejected',
    revoked: 'Revoked / cancelled',
}

// ---------------------------------------------------------------------------------------------------------
// EIS transmission
// ---------------------------------------------------------------------------------------------------------

export const TRANSMISSION_STATUSES = ['queued', 'sent', 'accepted', 'rejected', 'failed', 'cancelled'] as const
export type TransmissionStatus = (typeof TRANSMISSION_STATUSES)[number]

export const TRANSMISSION_STATUS_LABELS: Record<TransmissionStatus, string> = {
    queued: 'Queued',
    sent: 'Sent',
    accepted: 'Accepted by BIR',
    rejected: 'Rejected by BIR',
    failed: 'Failed (will retry)',
    cancelled: 'Cancelled (voided)',
}

// ---------------------------------------------------------------------------------------------------------
// Compliance documents
// ---------------------------------------------------------------------------------------------------------

export const DOCUMENT_CATEGORIES = [
    'cor',
    'cas_ac',
    'sworn_statement',
    'system_documentation',
    'pti',
    'eis_certification',
    'ptt',
    'bir_correspondence',
    'other',
] as const
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
    cor: 'Certificate of Registration (2303)',
    cas_ac: 'CAS Acknowledgment Certificate',
    sworn_statement: 'Sworn Statement (Annex A-1 / A-2)',
    system_documentation: 'System description & sample forms',
    pti: 'Permit to Issue (PTI)',
    eis_certification: 'EIS Certification',
    ptt: 'Permit to Transmit (PTT)',
    bir_correspondence: 'BIR correspondence',
    other: 'Other',
}

// ---------------------------------------------------------------------------------------------------------
// Regulatory references shown in the Compliance Center
// ---------------------------------------------------------------------------------------------------------

export const REGULATORY_REFERENCES = [
    {
        code: 'RA 11976',
        title: 'Ease of Paying Taxes (EOPT) Act',
        summary:
            'Makes the invoice the primary document for both goods and services; official receipts are supplementary.',
    },
    {
        code: 'RR 7-2024',
        title: 'EOPT invoicing requirements',
        summary: 'Mandatory invoice information, buyer details for sales of ₱1,000 or more, 5-year record retention.',
    },
    {
        code: 'RMC 5-2021',
        title: 'CAS/CBA registration (Acknowledgment Certificate)',
        summary:
            'Technical standards for computerized systems: audit trail, void-not-edit, per-branch series, security.',
    },
    {
        code: 'RR 8-2022',
        title: 'Electronic Invoicing System (EIS)',
        summary: 'Electronic invoices and sales data transmission to the BIR EIS.',
    },
    {
        code: 'RR 26-2025',
        title: 'E-invoicing deadline',
        summary: 'Covered taxpayers must issue e-invoices by December 31, 2026. Micro taxpayers are exempt.',
    },
    {
        code: 'RMC 98-2026',
        title: 'E-invoicing guidelines',
        summary: 'PTI before issuing e-invoices, EIS certification within 6 months, corrections via credit memo.',
    },
] as const
