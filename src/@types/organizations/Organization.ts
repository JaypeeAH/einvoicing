import type { TaxpayerSize } from '@/constants/bir.constant'
import type { OrganizationMeta } from './OrganizationMeta'

/** The taxpayer (seller). Values must match the BIR Certificate of Registration (Form 2303). */
export interface Organization extends OrganizationMeta {
    taxpayerSize: TaxpayerSize | null
    rdoCode: string
    registeredAddress: string
    zipCode: string
    lineOfBusiness: string | null
    email: string | null
    phone: string | null
    /** Default for new invoices: entered prices already include 12% VAT. */
    pricesIncludeVat: boolean
    /** Enqueue issued invoices for EIS transmission (turn on once a Permit to Transmit is held). */
    eisTransmissionEnabled: boolean
    createdAt: string
    updatedAt: string
}
