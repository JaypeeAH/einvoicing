import type { RegistrationStatus, RegistrationType } from '@/constants/bir.constant'

/** A BIR permit or certificate the taxpayer holds (or is applying for) for this invoicing system. */
export interface Registration {
    id: string
    organizationId: string
    registrationType: RegistrationType
    status: RegistrationStatus
    referenceNumber: string | null
    rdoCode: string | null
    systemName: string | null
    systemVersion: string | null
    filedOn: string | null
    approvedOn: string | null
    /** Deadline for the next step, e.g. EIS certification due 6 months after the PTI. */
    dueOn: string | null
    notes: string | null
    createdAt: string
    updatedAt: string
}
