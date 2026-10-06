import { z } from 'zod'
import { TAXPAYER_SIZES, VAT_REGISTRATIONS } from '@/constants/bir.constant'
import { isValidTin, normalizeTin } from '@/utils/tin'

export const OrganizationFormSchema = z.object({
    registeredName: z.string().trim().min(2, 'Enter the registered name exactly as shown on your COR (Form 2303)'),
    businessName: z.string().trim().max(200).nullable().optional(),
    tin: z
        .string()
        .trim()
        .refine(isValidTin, 'Enter the 9-digit TIN, e.g. 123-456-789')
        .transform((tin) => normalizeTin(tin)),
    vatRegistration: z.enum(VAT_REGISTRATIONS),
    taxpayerSize: z.enum(TAXPAYER_SIZES, { message: 'Select your taxpayer classification' }),
    rdoCode: z
        .string()
        .trim()
        .regex(/^\d{3}[A-Z]?$/i, 'Enter the 3-digit RDO code, e.g. 047'),
    registeredAddress: z.string().trim().min(5, 'Enter the registered address shown on your COR'),
    zipCode: z
        .string()
        .trim()
        .regex(/^\d{4}$/, 'Enter the 4-digit ZIP code'),
    lineOfBusiness: z.string().trim().max(200).nullable().optional(),
    email: z.string().trim().email('Enter a valid email').nullable().optional().or(z.literal('')),
    phone: z.string().trim().max(40).nullable().optional(),
    pricesIncludeVat: z.boolean(),
})

export type OrganizationFormData = z.input<typeof OrganizationFormSchema>
export type OrganizationPayload = z.output<typeof OrganizationFormSchema>

/** Company settings: the profile plus EIS transmission (turned on once a Permit to Transmit is held). */
export const OrganizationSettingsFormSchema = OrganizationFormSchema.extend({
    eisTransmissionEnabled: z.boolean(),
})

export type OrganizationSettingsFormData = z.input<typeof OrganizationSettingsFormSchema>
export type OrganizationSettingsPayload = z.output<typeof OrganizationSettingsFormSchema>
