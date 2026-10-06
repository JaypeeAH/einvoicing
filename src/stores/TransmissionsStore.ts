'use client'

import { createCollectionStore } from '@/stores/createCollectionStore'
import type { EisTransmission } from '@/@types/transmissions/EisTransmission'
import type { TransmissionStatus } from '@/constants/bir.constant'

export interface TransmissionsFilter {
    status?: TransmissionStatus
}

/** EIS transmission queue. */
export const useTransmissionsStore = createCollectionStore<EisTransmission, TransmissionsFilter>({})
