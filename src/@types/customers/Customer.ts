import type { CustomerType } from '@/constants/bir.constant'

/** A buyer. Invoices copy these details at issue time, so later edits never change an issued invoice. */
export interface Customer {
    id: string
    organizationId: string
    customerType: CustomerType
    registeredName: string
    businessName: string | null
    tin: string | null
    branchCode: string | null
    address: string | null
    email: string | null
    phone: string | null
    isVatRegistered: boolean
    isActive: boolean
    createdAt: string
    updatedAt: string
}
