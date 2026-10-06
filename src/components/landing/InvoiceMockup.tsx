'use client'

import { motion } from 'framer-motion'
import { formatAmount } from '@/utils/money'
import { SendIcon, SuccessIcon } from '@/configs/icons.config'

const LINES = [
    { qty: 2, description: 'Office chair, ergonomic', amount: 11200 },
    { qty: 1, description: 'Delivery and assembly', amount: 1120 },
]

/** Illustrative sample invoice for the homepage hero (not real data). */
export default function InvoiceMockup() {
    return (
        <div className="relative mx-auto w-full max-w-md" aria-hidden>
            <motion.div
                className="rounded-2xl border border-gray-200 bg-white p-6 text-[12px] text-gray-700 shadow-2xl shadow-primary/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
                <div className="flex items-start justify-between gap-4 border-b-2 border-gray-900 pb-3 dark:border-gray-100">
                    <div>
                        <div className="text-sm font-bold text-gray-900 uppercase dark:text-gray-100">
                            Sample Trading Corp.
                        </div>
                        <div>1 Ayala Ave, Makati City</div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                            VAT REG TIN: 123-456-789-00000
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-black tracking-wide text-gray-900 dark:text-gray-100">
                            SALES INVOICE
                        </div>
                        <div className="font-mono font-bold text-primary">SI-00000124</div>
                        <div>Oct 6, 2026</div>
                    </div>
                </div>
                <div className="border-b border-gray-200 py-2 dark:border-gray-700">
                    Sold to: <span className="font-semibold text-gray-900 dark:text-gray-100">Luzon Buyer Inc.</span>
                    <span className="ml-2 text-gray-500">TIN 987-654-321-00000</span>
                </div>
                <div className="py-2">
                    {LINES.map((line) => (
                        <div key={line.description} className="flex justify-between gap-4 py-0.5">
                            <span>
                                {line.qty} × {line.description}
                            </span>
                            <span className="tabular-nums">{formatAmount(line.amount)}</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                    <div className="space-y-0.5 text-gray-500">
                        <div className="flex justify-between">
                            <span>VATable Sales</span>
                            <span className="tabular-nums">{formatAmount(11000)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>VAT (12%)</span>
                            <span className="tabular-nums">{formatAmount(1320)}</span>
                        </div>
                    </div>
                    <div className="flex items-end justify-between font-bold text-gray-900 dark:text-gray-100">
                        <span>TOTAL DUE</span>
                        <span className="tabular-nums">₱{formatAmount(12320)}</span>
                    </div>
                </div>
                <div className="mt-3 border-t border-gray-200 pt-2 text-[10px] text-gray-400 dark:border-gray-700">
                    Acknowledgment Certificate No. ACCN-0000-0000 · Series SI-00000001 to SI-00500000
                </div>
            </motion.div>

            <motion.div
                className="absolute -top-4 -left-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-success shadow-lg sm:-left-8 dark:bg-gray-800"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
            >
                <SuccessIcon className="text-lg" /> Issued &amp; locked
            </motion.div>
            <motion.div
                className="absolute -right-4 -bottom-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-primary shadow-lg sm:-right-8 dark:bg-gray-800"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
            >
                <SendIcon className="text-lg" /> Queued for BIR EIS
            </motion.div>
        </div>
    )
}
