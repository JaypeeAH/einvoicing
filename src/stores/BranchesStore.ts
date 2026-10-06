'use client'

import { createResourceStore } from '@/stores/createResourceStore'
import type { Branch } from '@/@types/branches/Branch'

/** Branches of the current organization. */
export const useBranchesStore = createResourceStore<Branch[]>()
