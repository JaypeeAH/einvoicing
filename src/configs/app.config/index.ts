// Client-visible configuration. Secrets never go here — server-only settings are read from process.env
// inside src/server.

export const portalName = process.env.NEXT_PUBLIC_PORTAL_NAME || 'SME e-Invoicing'
export const portalDescription =
    process.env.NEXT_PUBLIC_PORTAL_DESCRIPTION ||
    'BIR-ready electronic invoicing for Philippine small and medium enterprises.'

/**
 * Software name and version printed on invoices and reports. They must match the system described in the
 * taxpayer's CAS registration (RMC 5-2021) — changing the version after registration needs an RDO notice.
 */
export const softwareName = process.env.NEXT_PUBLIC_SOFTWARE_NAME || portalName
export const softwareVersion = process.env.NEXT_PUBLIC_SOFTWARE_VERSION || '1.0.0'

/** The company that provides this system (co-signs the taxpayer's Joint Sworn Statement). */
export const providerName = process.env.NEXT_PUBLIC_PROVIDER_NAME || 'System Provider'

/** `test` shows a banner on every page so test invoices are never mistaken for real ones. */
export const appEnvironment = (process.env.NEXT_PUBLIC_APP_ENV || 'test') as 'test' | 'production'
export const isTestEnvironment = appEnvironment !== 'production'

export const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Paths
export const homePath = '/'
/** Public homepage. Signed-out visitors see it at `/` (see src/proxy.ts). */
export const welcomePath = '/welcome'
export const apiPath = '/api'
export const signInPath = '/sign-in'
export const signUpPath = '/sign-up'
export const forgotPasswordPath = '/forgot-password'
/** Where an invitation or password-reset link lands: the visitor sets a password to finish. */
export const setPasswordPath = '/set-password'
export const onboardingPath = '/onboarding'
export const accountPath = '/account'
export const changePasswordPath = '/account/password'
export const searchPath = '/invoices'

export const invoicesPath = '/invoices'
export const newInvoicePath = '/invoices/new'
export const customersPath = '/customers'
export const productsPath = '/products'
export const salesJournalPath = '/reports/sales-journal'
export const summaryListOfSalesPath = '/reports/summary-list-of-sales'
export const compliancePath = '/compliance'
export const registrationsPath = '/compliance/registrations'
export const transmissionsPath = '/compliance/transmissions'
export const documentsPath = '/compliance/documents'
export const companySettingsPath = '/settings/company'
export const branchesPath = '/settings/branches'
export const seriesPath = '/settings/series'
export const usersPath = '/settings/users'
export const auditTrailPath = '/settings/audit-trail'

export const getInvoicePath = (invoiceId: string) => `${invoicesPath}/${invoiceId}`
export const getEditInvoicePath = (invoiceId: string) => `${invoicesPath}/${invoiceId}/edit`
export const getPrintInvoicePath = (invoiceId: string) => `/print/invoices/${invoiceId}`
export const getNewMemoPath = (invoiceId: string, type: 'credit_memo' | 'debit_memo') =>
    `${newInvoicePath}?type=${type}&reference=${invoiceId}`

export const termsOfUseUrl = process.env.NEXT_PUBLIC_TERMS_URL || '#'
export const privacyPolicyUrl = process.env.NEXT_PUBLIC_PRIVACY_URL || '#'

export const activeNavTranslation = false
