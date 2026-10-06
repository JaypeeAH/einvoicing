'use client'

import { useSessionStore } from '@/stores/SessionStore'
import {
    NON_VAT_SELLER_TREATMENTS,
    TAX_TREATMENT_LABELS,
    VAT_SELLER_TREATMENTS,
    type TaxTreatment,
} from '@/constants/bir.constant'
import type { Option } from '@/@types/common'

/** Tax treatments the current seller can use: non-VAT sellers cannot sell VATable or zero-rated. */
export default function useTaxTreatmentOptions(): Option<TaxTreatment>[] {
    const vatRegistration = useSessionStore((state) => state.user?.organization?.vatRegistration)
    const treatments = vatRegistration === 'non_vat' ? NON_VAT_SELLER_TREATMENTS : VAT_SELLER_TREATMENTS
    return treatments.map((value) => ({ value, label: TAX_TREATMENT_LABELS[value] }))
}
