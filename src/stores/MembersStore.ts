'use client'

import { createResourceStore } from '@/stores/createResourceStore'
import type { Member } from '@/@types/members/Member'

/** Users of the current organization. */
export const useMembersStore = createResourceStore<Member[]>()
