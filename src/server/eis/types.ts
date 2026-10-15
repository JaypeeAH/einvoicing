import 'server-only'

import type { EisEnvironment } from '@/constants/bir.constant'

// Types of the BIR EIS e-invoice API (EIS e-invoice API development guide, chapter 7) and of the CAS
// e-invoice JSON (EIS e-invoice JSON File Format v2.1, sheet "1.e-invoice format-CAS"). Property names are
// BIR's and must not be renamed.

/** 01 VATable, 02 zero-rated, 03 VAT-exempt, 04 local sales of Registered Business Enterprises. */
export type EisTransClass = '01' | '02' | '03' | '04'

/** 01 invoice, 03 credit memo/credit note (debit memos were removed in v2.1). */
export type EisDocType = '01' | '03'

export interface EisItem {
    Nm: string
    Desc: string
    Qty: number
    Unit: string
    UnitCost: number
    SalesAmt: number
    RegDscntAmt: number
    SpeDscntAmt: number
    NetSales: number
}

/** One e-invoice as transmitted to the EIS (CAS format). Mixed documents become one e-invoice per TransClass. */
export interface EisCasInvoice {
    CompInvoiceId: string
    IssueDtm: string
    EisUniqueId: string
    DocType: EisDocType
    TransClass: EisTransClass
    CorrYN: 'Y' | 'N'
    CorrectionCd: string
    PrevUniqueId: string
    Rmk1: string
    SellerInfo: {
        Tin: string
        BranchCd: string
        Type: '0' | '1' | '2'
        RegNm: string
        BusinessNm: string
        Email: string
        RegAddr: string
    }
    BuyerInfo: {
        Tin: string
        BranchCd: string
        RegNm: string
        BusinessNm: string
        Email: string
        RegAddr: string
        DevAddr: string
        AirNum: string
        AirNumDt: string
        LadNum: string
        LadNumDt: string
    }
    ItemList: EisItem[]
    TotNetItemSales: number
    Discount: { ScAmt: number; PwdAmt: number; RegAmt: number; SpeAmt: number; Rmk2: string }
    OtherTaxRev: number
    TotNetSalesAftDisct: number
    VATAmt: number
    WithholdIncome: number
    WithholdBusVAT: number
    WithholdBusPT: number
    OtherNonTaxCharge: number
    NetAmtPay: number
    PtuNum: string
}

/** Credentials issued on the EIS Certification portal, decrypted for use. */
export interface EisConnection {
    environment: EisEnvironment
    apiBaseUrl: string
    /** EIS Cert Number (8 digits; the sandbox has its own test number). */
    accreditationId: string
    applicationId: string
    applicationKey: string
    userId: string
    password: string
    jwsKeyId: string
    jwsPrivateKey: string
    /** EIS public key used to encrypt the Authentication request. */
    eisPublicKey: string
}

/** Authentication token and session secret key (valid for 6 hours). */
export interface EisSession {
    authToken: string
    sessionKey: string
    expiresAt: string
}

export interface EisSubmissionAck {
    submitId: string
    ackId: string
    description: string
}

export interface EisDocumentResult {
    uniqueId: string
    /** SUC001 success; SYN00x / ERR0xx failures (API guide 7.3.3.7.3). */
    code: string
    description: string | null
}

export type EisInquiryResult =
    | { state: 'processing' }
    | { state: 'unavailable'; code: string; message: string }
    | { state: 'completed'; documents: EisDocumentResult[] }

export interface EisOutgoingDocument {
    uniqueId: string
    document: EisCasInvoice
}

/** Sends e-invoices and fetches their results — the BIR EIS, or a local simulation for test environments. */
export interface EisGateway {
    readonly name: string
    readonly simulated: boolean
    readonly environment: EisEnvironment
    readonly accreditationId: string
    submit(documents: EisOutgoingDocument[]): Promise<EisSubmissionAck>
    /** `documents` lets the simulation answer without keeping state; the BIR gateway ignores it. */
    inquire(submitId: string, documents: EisOutgoingDocument[]): Promise<EisInquiryResult>
}
