import type { TaxTreatment } from '@/constants/bir.constant'

/** A good or service that can be added to an invoice line. */
export interface Product {
    id: string
    organizationId: string
    sku: string | null
    name: string
    description: string | null
    unit: string
    unitPrice: number
    taxTreatment: TaxTreatment
    isService: boolean
    isActive: boolean
    createdAt: string
    updatedAt: string
}
