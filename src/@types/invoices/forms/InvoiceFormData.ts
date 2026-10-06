import { z } from 'zod'
import { DOCUMENT_TYPES, MEMO_DOCUMENT_TYPES, SPECIAL_DISCOUNT_TYPES, TAX_TREATMENTS } from '@/constants/bir.constant'
import { isValidTin, normalizeTin } from '@/utils/tin'

const optionalText = (max = 200) =>
    z
        .string()
        .trim()
        .max(max)
        .nullable()
        .optional()
        .transform((value) => value || null)

export const InvoiceLineFormSchema = z.object({
    productId: z.string().uuid().nullable().optional(),
    description: z.string().trim().min(1, 'Describe the goods or service').max(500),
    unit: z.string().trim().min(1, 'Unit').max(20),
    quantity: z.coerce.number().positive('Must be more than 0'),
    unitPrice: z.coerce.number().min(0, 'Cannot be negative'),
    discountAmount: z.coerce.number().min(0, 'Cannot be negative').default(0),
    taxTreatment: z.enum(TAX_TREATMENTS),
    specialDiscount: z.boolean().default(false),
})

export const InvoiceBuyerFormSchema = z.object({
    name: optionalText(),
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
})

export const InvoiceSpecialDiscountFormSchema = z.object({
    type: z.enum(SPECIAL_DISCOUNT_TYPES),
    idNumber: z.string().trim().min(3, 'Enter the ID number'),
    holderName: z.string().trim().min(2, 'Enter the cardholder name'),
    holderTin: optionalText(20),
})

export const InvoiceFormSchema = z
    .object({
        documentType: z.enum(DOCUMENT_TYPES),
        branchId: z.string().uuid('Select a branch'),
        invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a date'),
        dueDate: z
            .string()
            .nullable()
            .optional()
            .transform((value) => value || null),
        paymentTerms: optionalText(100),
        customerId: z.string().uuid().nullable().optional(),
        buyer: InvoiceBuyerFormSchema,
        pricesIncludeVat: z.boolean(),
        withholdingTaxRate: z.coerce.number().min(0).max(0.15).default(0),
        specialDiscount: InvoiceSpecialDiscountFormSchema.nullable().optional(),
        referenceInvoiceId: z.string().uuid().nullable().optional(),
        adjustmentReason: optionalText(500),
        manualInvoiceReference: optionalText(50),
        notes: optionalText(1000),
        lines: z.array(InvoiceLineFormSchema).min(1, 'Add at least one line'),
    })
    .superRefine((value, ctx) => {
        if (MEMO_DOCUMENT_TYPES.includes(value.documentType)) {
            if (!value.referenceInvoiceId) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['referenceInvoiceId'],
                    message: 'Select the invoice this memo adjusts',
                })
            }
            if (!value.adjustmentReason) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['adjustmentReason'],
                    message: 'Explain the reason for the adjustment',
                })
            }
        }
        if (value.lines.some((line) => line.specialDiscount) && !value.specialDiscount) {
            ctx.addIssue({
                code: 'custom',
                path: ['specialDiscount'],
                message: 'Enter the discount cardholder details',
            })
        }
        if (value.dueDate && value.dueDate < value.invoiceDate) {
            ctx.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date cannot be before the invoice date' })
        }
    })

export type InvoiceLineFormData = z.input<typeof InvoiceLineFormSchema>
export type InvoiceFormData = z.input<typeof InvoiceFormSchema>
export type InvoicePayload = z.output<typeof InvoiceFormSchema>

export const VoidInvoiceFormSchema = z.object({
    reason: z.string().trim().min(10, 'Explain why the invoice is voided (at least 10 characters)').max(500),
})

export type VoidInvoiceFormData = z.infer<typeof VoidInvoiceFormSchema>
