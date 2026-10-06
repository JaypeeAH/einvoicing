/** A BIR-registered place of business. Head office is branch code 00000. */
export interface Branch {
    id: string
    organizationId: string
    code: string
    name: string
    address: string
    rdoCode: string
    isHeadOffice: boolean
    status: 'active' | 'closed'
    createdAt: string
    updatedAt: string
}
