// Permission actions. Checked in the UI (navigation, buttons) and enforced again on the server and in
// database row-level security.

export const ACTION_INVOICE_VIEW = 'invoice:view'
export const ACTION_INVOICE_ISSUE = 'invoice:issue'
export const ACTION_INVOICE_VOID = 'invoice:void'
export const ACTION_MEMO_ISSUE = 'memo:issue'
export const ACTION_CUSTOMER_MANAGE = 'customer:manage'
export const ACTION_CUSTOMER_DELETE = 'customer:delete'
export const ACTION_PRODUCT_MANAGE = 'product:manage'
export const ACTION_REPORT_VIEW = 'report:view'
export const ACTION_COMPLIANCE_VIEW = 'compliance:view'
export const ACTION_COMPLIANCE_MANAGE = 'compliance:manage'
export const ACTION_SETTINGS_MANAGE = 'settings:manage'
export const ACTION_USER_MANAGE = 'user:manage'
export const ACTION_AUDIT_VIEW = 'audit:view'

export const ACTIONS = [
    ACTION_INVOICE_VIEW,
    ACTION_INVOICE_ISSUE,
    ACTION_INVOICE_VOID,
    ACTION_MEMO_ISSUE,
    ACTION_CUSTOMER_MANAGE,
    ACTION_CUSTOMER_DELETE,
    ACTION_PRODUCT_MANAGE,
    ACTION_REPORT_VIEW,
    ACTION_COMPLIANCE_VIEW,
    ACTION_COMPLIANCE_MANAGE,
    ACTION_SETTINGS_MANAGE,
    ACTION_USER_MANAGE,
    ACTION_AUDIT_VIEW,
] as const

export type Action = (typeof ACTIONS)[number]
