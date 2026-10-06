'use client'

import { motion } from 'framer-motion'
import type { CommonProps } from '@/@types/common'

interface RevealProps extends CommonProps {
    /** Seconds to wait before animating (stagger items in a grid). */
    delay?: number
}

/**
 * Fades content up when it scrolls into view. Movement is skipped for visitors who prefer reduced motion
 * (see LandingMotionConfig), and the markup is the same on server and client.
 */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut', delay }}
        >
            {children}
        </motion.div>
    )
}
