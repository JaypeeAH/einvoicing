import { z } from 'zod'
import { REGISTRATION_STATUSES, REGISTRATION_TYPES } from '@/constants/bir.constant'

const optionalText = (max = 200) =>
    z
        .string()
        .trim()
        .max(max)
        .nullable()
        .optional()
        .transform((value) => value || null)

const optionalDate = z
    .string()
    .nullable()
    .optional()
    .transform((value) => value || null)

export const RegistrationFormSchema = z
    .object({
        registrationType: z.enum(REGISTRATION_TYPES),
        status: z.enum(REGISTRATION_STATUSES),
        referenceNumber: optionalText(100),
        rdoCode: optionalText(5),
        systemName: optionalText(),
        systemVersion: optionalText(50),
        filedOn: optionalDate,
        approvedOn: optionalDate,
        dueOn: optionalDate,
        notes: optionalText(1000),
    })
    .superRefine((value, ctx) => {
        if (value.status === 'approved' && !value.referenceNumber) {
            ctx.addIssue({
                code: 'custom',
                path: ['referenceNumber'],
                message: 'Enter the permit or certificate number',
            })
        }
        if (value.status === 'approved' && !value.approvedOn) {
            ctx.addIssue({ code: 'custom', path: ['approvedOn'], message: 'Enter the date it was approved' })
        }
    })

export type RegistrationFormData = z.input<typeof RegistrationFormSchema>
export type RegistrationPayload = z.output<typeof RegistrationFormSchema>
