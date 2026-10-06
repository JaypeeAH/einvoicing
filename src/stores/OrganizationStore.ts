'use client'

import { createResourceStore } from '@/stores/createResourceStore'
import type { Organization } from '@/@types/organizations/Organization'

/** The current organization (taxpayer profile). */
export const useOrganizationStore = createResourceStore<Organization>()
