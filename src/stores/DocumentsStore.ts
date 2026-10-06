'use client'

import { createResourceStore } from '@/stores/createResourceStore'
import type { ComplianceDocument } from '@/@types/documents/ComplianceDocument'

/** Compliance documents. */
export const useDocumentsStore = createResourceStore<ComplianceDocument[]>()
