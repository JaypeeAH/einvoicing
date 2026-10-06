import type { JSX } from 'react'
import {
    PiBookOpenTextDuotone,
    PiBuildingsDuotone,
    PiClockCounterClockwiseDuotone,
    PiFolderSimpleDuotone,
    PiHashDuotone,
    PiListChecksDuotone,
    PiPackageDuotone,
    PiPaperPlaneTiltDuotone,
    PiReceiptDuotone,
    PiSealCheckDuotone,
    PiShieldCheckDuotone,
    PiSquaresFourDuotone,
    PiStorefrontDuotone,
    PiUserGearDuotone,
    PiUsersThreeDuotone,
} from 'react-icons/pi' // https://react-icons.github.io/react-icons/icons/pi/
import {
    TbActivity,
    TbAlertCircle,
    TbAlertTriangle,
    TbArrowDownRight,
    TbArrowLeft,
    TbArrowRight,
    TbArrowUpRight,
    TbArrowsSort,
    TbBan,
    TbBuilding,
    TbBuildingStore,
    TbCalendar,
    TbCalendarDue,
    TbCheck,
    TbChevronDown,
    TbChevronLeft,
    TbChevronRight,
    TbChevronUp,
    TbCircleCheck,
    TbCirclePlus,
    TbCircleX,
    TbClipboardCheck,
    TbClock,
    TbCloudUpload,
    TbCopy,
    TbCurrencyPeso,
    TbDeviceFloppy,
    TbDotsVertical,
    TbDownload,
    TbEdit,
    TbExternalLink,
    TbEye,
    TbFile,
    TbFileInvoice,
    TbFileSpreadsheet,
    TbFileText,
    TbFileUpload,
    TbFilter,
    TbHistory,
    TbInfoCircle,
    TbKey,
    TbLoader2,
    TbLock,
    TbLogout,
    TbMail,
    TbMoon,
    TbPlayerPlay,
    TbPlus,
    TbPrinter,
    TbReceipt2,
    TbReceiptRefund,
    TbRefresh,
    TbSearch,
    TbSelector,
    TbSend,
    TbShieldCheck,
    TbSun,
    TbSwitchHorizontal,
    TbThumbDown,
    TbThumbUp,
    TbTrash,
    TbUser,
    TbUserCircle,
    TbUsers,
    TbX,
} from 'react-icons/tb' // https://react-icons.github.io/react-icons/icons/tb/

// Semantic icon names. Always import icons from here, never from react-icons directly, so the same
// concept looks the same everywhere.

// Navigation
export const DashboardNavIcon = PiSquaresFourDuotone
export const InvoicesNavIcon = PiReceiptDuotone
export const CustomersNavIcon = PiUsersThreeDuotone
export const ProductsNavIcon = PiPackageDuotone
export const SalesJournalNavIcon = PiBookOpenTextDuotone
export const SummaryListNavIcon = PiListChecksDuotone
export const ComplianceNavIcon = PiShieldCheckDuotone
export const RegistrationsNavIcon = PiSealCheckDuotone
export const TransmissionsNavIcon = PiPaperPlaneTiltDuotone
export const DocumentsNavIcon = PiFolderSimpleDuotone
export const CompanyNavIcon = PiBuildingsDuotone
export const BranchesNavIcon = PiStorefrontDuotone
export const SeriesNavIcon = PiHashDuotone
export const UsersNavIcon = PiUserGearDuotone
export const AuditTrailNavIcon = PiClockCounterClockwiseDuotone

// Entities
export const InvoiceIcon = TbFileInvoice
export const CreditMemoIcon = TbReceiptRefund
export const DebitMemoIcon = TbReceipt2
export const CustomerIcon = TbUser
export const UsersIcon = TbUsers
export const BuildingIcon = TbBuilding
export const BranchIcon = TbBuildingStore
export const FileIcon = TbFile
export const DocumentIcon = TbFileText
export const SpreadsheetIcon = TbFileSpreadsheet
export const PersonIcon = TbUser
export const AccountIcon = TbUserCircle
export const DateIcon = TbCalendar
export const DueDateIcon = TbCalendarDue
export const TimeIcon = TbClock
export const ActivityIcon = TbActivity
export const VersionHistoryIcon = TbHistory
export const PesoIcon = TbCurrencyPeso
export const ChecklistIcon = TbClipboardCheck
export const ComplianceIcon = TbShieldCheck
export const PasswordIcon = TbKey

// Actions
export const AddIcon = TbPlus
export const AddCircleIcon = TbCirclePlus
export const EditIcon = TbEdit
export const DeleteIcon = TbTrash
export const DuplicateIcon = TbCopy
export const SaveIcon = TbDeviceFloppy
export const DownloadIcon = TbDownload
export const UploadIcon = TbFileUpload
export const UploadCloudIcon = TbCloudUpload
export const ViewIcon = TbEye
export const ExternalLinkIcon = TbExternalLink
export const SearchIcon = TbSearch
export const FilterIcon = TbFilter
export const SortIcon = TbArrowsSort
export const RefreshIcon = TbRefresh
export const ClearIcon = TbX
export const CloseIcon = TbX
export const BackIcon = TbArrowLeft
export const ForwardIcon = TbArrowRight
export const ApproveIcon = TbThumbUp
export const RejectIcon = TbThumbDown
export const PrintIcon = TbPrinter
export const SendIcon = TbSend
export const EmailIcon = TbMail
export const VoidIcon = TbBan
export const IssueIcon = TbCheck
export const RunIcon = TbPlayerPlay
export const SignOutIcon = TbLogout
export const SwitchIcon = TbSwitchHorizontal
export const SelectorIcon = TbSelector
export const MoreIcon = TbDotsVertical
export const LightModeIcon = TbSun
export const DarkModeIcon = TbMoon
export const PreviousIcon = TbChevronLeft
export const NextIcon = TbChevronRight
export const ExpandIcon = TbChevronDown
export const CollapseIcon = TbChevronUp
export const TrendUpIcon = TbArrowUpRight
export const TrendDownIcon = TbArrowDownRight

// Status
export const SuccessIcon = TbCircleCheck
export const WarningIcon = TbAlertTriangle
export const ErrorIcon = TbAlertCircle
export const FailedIcon = TbCircleX
export const InfoIcon = TbInfoCircle
export const LockedIcon = TbLock
export const SpinnerIcon = TbLoader2

/** Icons by navigation key (`icon` in configs/navigation.config). */
const navigationIcon: Record<string, JSX.Element> = {
    dashboard: <DashboardNavIcon />,
    invoices: <InvoicesNavIcon />,
    customers: <CustomersNavIcon />,
    products: <ProductsNavIcon />,
    salesJournal: <SalesJournalNavIcon />,
    summaryListOfSales: <SummaryListNavIcon />,
    compliance: <ComplianceNavIcon />,
    registrations: <RegistrationsNavIcon />,
    transmissions: <TransmissionsNavIcon />,
    documents: <DocumentsNavIcon />,
    company: <CompanyNavIcon />,
    branches: <BranchesNavIcon />,
    series: <SeriesNavIcon />,
    users: <UsersNavIcon />,
    auditTrail: <AuditTrailNavIcon />,
}

export default navigationIcon
