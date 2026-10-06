'use client'

import { MotionConfig } from 'framer-motion'
import type { ProviderProps } from '@/@types/common'

/** Homepage animations follow the visitor's "reduce motion" setting (fades only, no movement). */
export default function LandingMotionConfig({ children }: ProviderProps) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
