'use client'

import { useSWRDocuments } from '@/services/documents'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useSyncResource } from '@/utils/hooks/useSWRSync'
import type { ProviderProps } from '@/@types/common'

/** Loads compliance documents into DocumentsStore. */
export default function DocumentsSWRProvider({ children }: ProviderProps) {
    useSyncResource(useDocumentsStore, useSWRDocuments())
    return <>{children}</>
}
