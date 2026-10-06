import { z } from 'zod'

/** CAS security standard (RMC 5-2021 Annex B): passwords of at least 10 characters mixing letters and numbers. */
export const PASSWORD_MIN_LENGTH = 10

/** Supabase (bcrypt) ignores anything after 72 characters. */
export const PASSWORD_MAX_LENGTH = 72

export const PASSWORD_RULE_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with both letters and numbers.`

export const PasswordSchema = z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Use ${PASSWORD_MAX_LENGTH} characters or fewer`)
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number')

/** Adds a "passwords don't match" error on `confirmPassword` (use with `.superRefine`). */
export const refinePasswordConfirmation = (
    value: { password: string; confirmPassword: string },
    ctx: z.RefinementCtx,
) => {
    if (value.confirmPassword && value.password !== value.confirmPassword) {
        ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'The passwords don’t match' })
    }
}
