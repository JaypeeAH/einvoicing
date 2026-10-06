import { z } from 'zod'
import { MAX_DOCUMENT_BYTES } from '@/constants/app.constant'
import { DOCUMENT_CATEGORIES } from '@/constants/bir.constant'

/** Largest file accepted for upload (the server enforces the same limit). */
export { MAX_DOCUMENT_BYTES }

/** File types accepted for compliance documents. */
export const DOCUMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg'

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg']

const isFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File

export const DocumentUploadFormSchema = z.object({
    category: z.enum(DOCUMENT_CATEGORIES, { errorMap: () => ({ message: 'Select a category' }) }),
    title: z.string().trim().min(2, 'Enter a title for the document').max(200),
    file: z
        .custom<File | null>((value) => value === null || isFile(value))
        .refine((file): file is File => isFile(file), 'Choose a file to upload')
        .refine(
            (file) => isFile(file) && ALLOWED_EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase() ?? ''),
            'Upload a PDF, PNG or JPG file',
        )
        .refine((file) => isFile(file) && file.size <= MAX_DOCUMENT_BYTES, 'The file must be 10 MB or smaller'),
})

export type DocumentUploadFormData = z.input<typeof DocumentUploadFormSchema>
