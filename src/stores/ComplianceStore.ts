'use client'

import { createResourceStore } from '@/stores/createResourceStore'
import type { ComplianceStatus } from '@/@types/compliance/ComplianceStatus'

/** Compliance Center status (coverage, registrations, checklist). */
export const useComplianceStore = createResourceStore<ComplianceStatus>()
