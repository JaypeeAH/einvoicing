import type { VatRegistration } from '@/constants/bir.constant'

/** Lightweight organization identity used in the header, switcher and session. */
export interface OrganizationMeta {
    id: string
    registeredName: string
    businessName: string | null
    tin: string
    vatRegistration: VatRegistration
}
