import { z } from 'zod'
import { CUSTOMER_TYPES } from '@/constants/bir.constant'
import { isValidTin, normalizeTin } from '@/utils/tin'

const optionalText = (max = 200) =>
    z
        .string()
        .trim()
        .max(max)
        .nullable()
        .optional()
        .transform((value) => value || null)

export const CustomerFormSchema = z
    .object({
        customerType: z.enum(CUSTOMER_TYPES),
        registeredName: z.string().trim().min(2, 'Enter the customer name'),
        businessName: optionalText(),
        tin: z
            .string()
            .trim()
            .nullable()
            .optional()
            .refine((tin) => !tin || isValidTin(tin), 'Enter a 9-digit TIN, e.g. 123-456-789')
            .transform((tin) => (tin ? normalizeTin(tin) : null)),
        branchCode: z
            .string()
            .trim()
            .nullable()
            .optional()
            .refine((code) => !code || /^\d{3,5}$/.test(code), 'Branch code is 3 to 5 digits')
            .transform((code) => (code ? code.padStart(5, '0') : null)),
        address: optionalText(300),
        email: z
            .string()
            .trim()
            .email('Enter a valid email')
            .nullable()
            .optional()
            .or(z.literal(''))
            .transform((value) => value || null),
        phone: optionalText(40),
        isVatRegistered: z.boolean(),
        isActive: z.boolean(),
    })
    .superRefine((value, ctx) => {
        // Buyer TIN and address are required for VAT-registered buyers so they can claim input tax (RR 7-2024)
        if (value.isVatRegistered && !value.tin) {
            ctx.addIssue({ code: 'custom', path: ['tin'], message: 'TIN is required for VAT-registered customers' })
        }
        if (value.isVatRegistered && !value.address) {
            ctx.addIssue({
                code: 'custom',
                path: ['address'],
                message: 'Address is required for VAT-registered customers',
            })
        }
    })

export type CustomerFormData = z.input<typeof CustomerFormSchema>
export type CustomerPayload = z.output<typeof CustomerFormSchema>
