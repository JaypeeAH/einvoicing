import { type NavigationTree } from '@/@types/navigation'
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_TITLE } from '@/constants/navigation.constant'
import {
    ACTION_AUDIT_VIEW,
    ACTION_COMPLIANCE_VIEW,
    ACTION_CUSTOMER_MANAGE,
    ACTION_INVOICE_VIEW,
    ACTION_PRODUCT_MANAGE,
    ACTION_REPORT_VIEW,
    ACTION_SETTINGS_MANAGE,
    ACTION_USER_MANAGE,
    type Action,
} from '@/constants/actions.constant'
import {
    auditTrailPath,
    branchesPath,
    companySettingsPath,
    compliancePath,
    customersPath,
    documentsPath,
    homePath,
    invoicesPath,
    productsPath,
    registrationsPath,
    salesJournalPath,
    seriesPath,
    summaryListOfSalesPath,
    transmissionsPath,
    usersPath,
} from '@/configs/app.config'

const item = (key: string, path: string, title: string, icon: string, authority: Action[] = []): NavigationTree => ({
    key,
    path,
    title,
    icon,
    type: NAV_ITEM_TYPE_ITEM,
    authority,
    subMenu: [],
})

const group = (key: string, title: string, subMenu: NavigationTree[]): NavigationTree => ({
    key,
    path: '',
    title,
    icon: '',
    type: NAV_ITEM_TYPE_TITLE,
    authority: [],
    subMenu,
})

/**
 * Side navigation, grouped by task. Entries are hidden when the user's role lacks every listed action
 * (the pages and API check permissions again).
 */
const navigationConfig: NavigationTree[] = [
    group('overview', '', [item('dashboard', homePath, 'Dashboard', 'dashboard')]),
    group('sales', 'Sales', [
        item('invoices', invoicesPath, 'Invoices & Memos', 'invoices', [ACTION_INVOICE_VIEW]),
        item('customers', customersPath, 'Customers', 'customers', [ACTION_INVOICE_VIEW, ACTION_CUSTOMER_MANAGE]),
        item('products', productsPath, 'Products & Services', 'products', [ACTION_INVOICE_VIEW, ACTION_PRODUCT_MANAGE]),
    ]),
    group('reports', 'Reports', [
        item('salesJournal', salesJournalPath, 'Sales Journal', 'salesJournal', [ACTION_REPORT_VIEW]),
        item('summaryListOfSales', summaryListOfSalesPath, 'Summary List of Sales', 'summaryListOfSales', [
            ACTION_REPORT_VIEW,
        ]),
    ]),
    group('compliance', 'BIR Compliance', [
        item('complianceCenter', compliancePath, 'Compliance Center', 'compliance', [ACTION_COMPLIANCE_VIEW]),
        item('registrations', registrationsPath, 'Registrations & Permits', 'registrations', [ACTION_COMPLIANCE_VIEW]),
        item('transmissions', transmissionsPath, 'EIS Transmissions', 'transmissions', [ACTION_COMPLIANCE_VIEW]),
        item('documents', documentsPath, 'Documents', 'documents', [ACTION_COMPLIANCE_VIEW]),
    ]),
    group('settings', 'Administration', [
        item('company', companySettingsPath, 'Company Profile', 'company', [ACTION_SETTINGS_MANAGE]),
        item('branches', branchesPath, 'Branches', 'branches', [ACTION_SETTINGS_MANAGE]),
        item('series', seriesPath, 'Invoice Series', 'series', [ACTION_SETTINGS_MANAGE]),
        item('users', usersPath, 'Users & Roles', 'users', [ACTION_USER_MANAGE]),
        item('auditTrail', auditTrailPath, 'Audit Trail', 'auditTrail', [ACTION_AUDIT_VIEW]),
    ]),
]

export default navigationConfig
