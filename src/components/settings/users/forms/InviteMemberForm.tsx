'use client'

import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import RoleSelect from '@/components/settings/users/RoleSelect'
import { InviteMemberFormSchema, type InviteMemberFormData } from '@/@types/members/forms/MemberFormData'
import { ROLE_CASHIER, type Role } from '@/constants/roles.constant'

interface InviteMemberFormProps {
    id: string
    /** Roles the current user may grant. */
    roles: readonly Role[]
    onSubmit: (data: InviteMemberFormData) => Promise<void>
}

/** Name, email and role of the person to invite. */
export default function InviteMemberForm({ id, roles, onSubmit }: InviteMemberFormProps) {
    const form = useForm<InviteMemberFormData>({
        resolver: zodResolver(InviteMemberFormSchema),
        defaultValues: { fullName: '', email: '', role: ROLE_CASHIER },
    })
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form

    return (
        <FormProvider {...form}>
            <Form id={id} onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormItem
                    label="Full name"
                    asterisk
                    invalid={!!errors.fullName}
                    errorMessage={errors.fullName?.message}
                >
                    <Controller
                        name="fullName"
                        control={control}
                        render={({ field }) => <Input {...field} placeholder="e.g. Maria Santos" autoFocus />}
                    />
                </FormItem>
                <FormItem label="Email" asterisk invalid={!!errors.email} errorMessage={errors.email?.message}>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => <Input {...field} type="email" placeholder="Their own work email" />}
                    />
                </FormItem>
                <FormItem
                    label="Role"
                    asterisk
                    invalid={!!errors.role}
                    errorMessage={errors.role?.message}
                    className="mb-0"
                >
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
            </Form>
        </FormProvider>
    )
}
