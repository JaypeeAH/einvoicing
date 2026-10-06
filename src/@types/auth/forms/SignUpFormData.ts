import { z } from 'zod'
import { PasswordSchema, refinePasswordConfirmation } from './PasswordSchema'

export const SignUpFormSchema = z
    .object({
        fullName: z.string().trim().min(2, 'Enter your full name').max(120),
        email: z.string().trim().toLowerCase().email('Enter a valid email'),
        password: PasswordSchema,
        confirmPassword: z.string().min(1, 'Type the password again'),
    })
    .superRefine(refinePasswordConfirmation)

export type SignUpFormData = z.infer<typeof SignUpFormSchema>
