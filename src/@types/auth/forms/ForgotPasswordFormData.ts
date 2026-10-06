import { z } from 'zod'

export const ForgotPasswordFormSchema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
})

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordFormSchema>
