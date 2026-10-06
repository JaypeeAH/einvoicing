'use client'

import { Controller, useFormContext } from 'react-hook-form'
import { FormItem } from '@/components/ui/Form'
import Switcher from '@/components/ui/Switcher'
import { EIS_TRANSMISSION_DAYS } from '@/constants/bir.constant'
import type { OrganizationSettingsFormData } from '@/@types/organizations/forms/OrganizationFormData'

/** EIS transmission switch, rendered inside OrganizationForm on the company settings page. */
export default function EisTransmissionField() {
    const { control } = useFormContext<OrganizationSettingsFormData>()

    return (
        <>
            <h6 className="mb-4 border-b border-gray-100 pb-2 font-semibold text-gray-900 sm:col-span-2 dark:border-gray-700 dark:text-gray-100">
                BIR Electronic Invoicing System (EIS)
            </h6>
            <FormItem label="Send invoices to the BIR EIS" className="sm:col-span-2">
                <Controller
                    name="eisTransmissionEnabled"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-start gap-3">
                            <Switcher checked={field.value} onChange={(checked) => field.onChange(checked)} />
                            <span className="text-gray-500 dark:text-gray-400">
                                Turn on only after BIR issues your Permit to Transmit (PTT). Issued invoices are then
                                queued and sent to the BIR EIS within {EIS_TRANSMISSION_DAYS} days.
                            </span>
                        </div>
                    )}
                />
            </FormItem>
        </>
    )
}
