import { z } from 'zod'

export const SignInFormSchema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(1, 'Enter your password'),
})

export type SignInFormData = z.infer<typeof SignInFormSchema>
