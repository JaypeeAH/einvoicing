import { z } from 'zod'
import { EIS_ENVIRONMENTS } from '@/constants/bir.constant'

/** Left blank when editing: keeps the saved secret. */
const secret = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((value) => value || null)

/** Credentials from the EIS Certification portal (Applications → Setting, and the downloaded credential file). */
export const EisConnectionFormSchema = z.object({
    environment: z.enum(EIS_ENVIRONMENTS),
    apiBaseUrl: z
        .string()
        .trim()
        .url('Enter the API address, e.g. https://eis-cert.bir.gov.ph')
        .refine((value) => value.startsWith('https://'), 'The address must start with https://'),
    accreditationId: z
        .string()
        .trim()
        .regex(/^\d{8}$/, 'The EIS Cert Number has 8 digits'),
    applicationId: z.string().trim().min(1, 'Enter the Application ID').max(100),
    userId: z.string().trim().min(1, 'Enter your EIS Certification portal user ID').max(100),
    password: secret(200),
    applicationKey: secret(200),
    jwsKeyId: z.string().trim().min(1, 'Enter the key ID of the digital signing key pair').max(200),
    jwsPrivateKey: secret(10000),
})

export type EisConnectionFormData = z.input<typeof EisConnectionFormSchema>
export type EisConnectionPayload = z.output<typeof EisConnectionFormSchema>
