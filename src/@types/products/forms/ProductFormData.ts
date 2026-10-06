import { z } from 'zod'
import { TAX_TREATMENTS } from '@/constants/bir.constant'

export const ProductFormSchema = z.object({
    sku: z
        .string()
        .trim()
        .max(50)
        .nullable()
        .optional()
        .transform((value) => value || null),
    name: z.string().trim().min(2, 'Enter a name'),
    description: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional()
        .transform((value) => value || null),
    unit: z.string().trim().min(1, 'Enter a unit, e.g. pc, hr, kg').max(20),
    unitPrice: z.coerce.number().min(0, 'Price cannot be negative'),
    taxTreatment: z.enum(TAX_TREATMENTS),
    isService: z.boolean(),
    isActive: z.boolean(),
})

export type ProductFormData = z.input<typeof ProductFormSchema>
export type ProductPayload = z.output<typeof ProductFormSchema>
