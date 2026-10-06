import { z } from 'zod'
import { PasswordSchema, refinePasswordConfirmation } from './PasswordSchema'

export const ChangePasswordFormSchema = z
    .object({
        password: PasswordSchema,
        confirmPassword: z.string().min(1, 'Type the new password again'),
    })
    .superRefine(refinePasswordConfirmation)

export type ChangePasswordFormData = z.infer<typeof ChangePasswordFormSchema>
