import { z } from 'zod'
import { ROLES } from '@/constants/roles.constant'

export const InviteMemberFormSchema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    fullName: z.string().trim().min(2, 'Enter the person’s name'),
    role: z.enum(ROLES),
})

export type InviteMemberFormData = z.infer<typeof InviteMemberFormSchema>

export const UpdateMemberFormSchema = z.object({
    role: z.enum(ROLES),
    status: z.enum(['active', 'suspended']),
})

export type UpdateMemberFormData = z.infer<typeof UpdateMemberFormSchema>
