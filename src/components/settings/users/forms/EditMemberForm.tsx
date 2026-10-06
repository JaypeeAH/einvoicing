'use client'

import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Segment from '@/components/ui/Segment'
import RoleSelect from '@/components/settings/users/RoleSelect'
import { UpdateMemberFormSchema, type UpdateMemberFormData } from '@/@types/members/forms/MemberFormData'
import type { Member } from '@/@types/members/Member'
import type { Role } from '@/constants/roles.constant'

interface EditMemberFormProps {
    id: string
    member: Member
    /** Roles the current user may grant. */
    roles: readonly Role[]
    onSubmit: (data: UpdateMemberFormData) => Promise<void>
}

/** Change a person's role, or suspend / restore their access. */
export default function EditMemberForm({ id, member, roles, onSubmit }: EditMemberFormProps) {
    const form = useForm<UpdateMemberFormData>({
        resolver: zodResolver(UpdateMemberFormSchema),
        defaultValues: { role: member.role, status: member.status === 'suspended' ? 'suspended' : 'active' },
    })
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form
    const status = useWatch({ control, name: 'status' })

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormItem label="Role" asterisk invalid={!!errors.role} errorMessage={errors.role?.message}>
                    <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                            <RoleSelect
                                roles={roles}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Access" className="mb-0">
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Segment
                                size="sm"
                                value={field.value}
                                onChange={(value) => typeof value === 'string' && value && field.onChange(value)}
                            >
                                <Segment.Item value="active">Allowed</Segment.Item>
                                <Segment.Item value="suspended">Suspended</Segment.Item>
                            </Segment>
                        )}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {status === 'suspended'
                            ? 'They can’t open this business until you restore access. Their past records are kept.'
                            : member.status === 'invited'
                              ? 'They haven’t accepted the invitation yet. They can sign in once they do.'
                              : 'They can sign in and work in this business.'}
                    </p>
                </FormItem>
            </Form>
        </FormProvider>
    )
}
