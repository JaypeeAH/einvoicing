import { z } from 'zod'
import { DOCUMENT_TYPES, MIN_SERIAL_DIGITS } from '@/constants/bir.constant'

export const DocumentSeriesFormSchema = z
    .object({
        branchId: z.string().uuid('Select a branch'),
        documentType: z.enum(DOCUMENT_TYPES),
        prefix: z
            .string()
            .trim()
            .max(10)
            .regex(/^[A-Z0-9-]*$/i, 'Use letters, numbers or dashes only'),
        startNumber: z.coerce.number().int().min(1, 'Start at 1 or higher'),
        endNumber: z.coerce.number().int().min(1),
        padding: z.coerce.number().int().min(MIN_SERIAL_DIGITS, `At least ${MIN_SERIAL_DIGITS} digits`).max(12),
        acNumber: z.string().trim().min(3, 'Enter the Acknowledgment Certificate control number (ACCN)'),
        acDate: z.string().min(1, 'Enter the date the certificate was issued'),
        isActive: z.boolean(),
    })
    .superRefine((value, ctx) => {
        if (value.endNumber < value.startNumber) {
            ctx.addIssue({ code: 'custom', path: ['endNumber'], message: 'End must be after the start number' })
        }
        if (String(value.endNumber).length > value.padding) {
            ctx.addIssue({ code: 'custom', path: ['padding'], message: 'Too few digits for the end number' })
        }
    })

export type DocumentSeriesFormData = z.input<typeof DocumentSeriesFormSchema>
export type DocumentSeriesPayload = z.output<typeof DocumentSeriesFormSchema>
