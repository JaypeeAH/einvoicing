import { z } from 'zod'

export const BranchFormSchema = z.object({
    code: z
        .string()
        .trim()
        .regex(/^\d{5}$/, 'Branch code is 5 digits (head office is 00000)'),
    name: z.string().trim().min(2, 'Enter a branch name'),
    address: z.string().trim().min(5, 'Enter the registered branch address'),
    rdoCode: z
        .string()
        .trim()
        .regex(/^\d{3}[A-Z]?$/i, 'Enter the 3-digit RDO code'),
    status: z.enum(['active', 'closed']),
})

export type BranchFormData = z.infer<typeof BranchFormSchema>
