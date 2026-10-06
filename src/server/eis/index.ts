import 'server-only'

import { eisProvider } from '@/server/env'
import { BirEisProvider } from './BirEisProvider'
import { MockEisProvider } from './MockEisProvider'
import type { EisProvider } from './types'

/** The configured EIS provider (`EIS_PROVIDER=mock` for test, `bir` for production). */
export const getEisProvider = (): EisProvider => (eisProvider === 'bir' ? new BirEisProvider() : new MockEisProvider())
