'use client'

import { createResourceStore } from '@/stores/createResourceStore'
import type { Registration } from '@/@types/registrations/Registration'

/** BIR registrations and permits. */
export const useRegistrationsStore = createResourceStore<Registration[]>()
