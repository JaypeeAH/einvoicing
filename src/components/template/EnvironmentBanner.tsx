import { isTestEnvironment } from '@/configs/app.config'
import { WarningIcon } from '@/configs/icons.config'

/** Shown on every page outside production so test invoices are never mistaken for real ones. */
export default function EnvironmentBanner() {
    if (!isTestEnvironment) return null
    return (
        <div className="flex items-center justify-center gap-2 bg-warning px-4 py-1.5 text-center text-xs font-semibold text-white print:hidden">
            <WarningIcon className="text-base" />
            TEST ENVIRONMENT — documents issued here are not valid invoices and are not sent to BIR.
        </div>
    )
}
