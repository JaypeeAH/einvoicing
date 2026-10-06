'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthError } from '@supabase/supabase-js'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { getBrowserSupabase } from '@/services/supabase/browser'
import { apiMarkPasswordChanged } from '@/services/session'
import { tryGetErrorMessage } from '@/utils/errors'
import { ChangePasswordFormSchema, type ChangePasswordFormData } from '@/@types/auth/forms/ChangePasswordFormData'
import { PASSWORD_RULE_HINT } from '@/@types/auth/forms/PasswordSchema'
import { homePath, signInPath } from '@/configs/app.config'

interface SetPasswordFormProps {
    /** The signed-in email, so the visitor can see which account they are finishing. */
    email: string
}

const COPY = {
    invite: {
        title: 'Welcome aboard',
        description: 'Choose a password to finish setting up your account.',
    },
    recovery: {
        title: 'Choose a new password',
        description: 'Pick a password you haven’t used here before.',
    },
    default: {
        title: 'Set your password',
        description: 'Choose a password for your account.',
    },
}

const getUpdateErrorMessage = (error: AuthError) => {
    if (error.code === 'same_password') return 'Choose a password that’s different from your current one.'
    if (error.code === 'weak_password') {
        return 'That password is too easy to guess. Try a longer one with letters and numbers.'
    }
    if (error.code === 'session_not_found' || error.status === 401) {
        return 'This link has expired. Request a new one and try again.'
    }
    return 'We couldn’t save your password. Please try again.'
}

/** Sets the first password after an invitation, or a new one after a password reset. */
export default function SetPasswordForm({ email }: SetPasswordFormProps) {
    const searchParams = useSearchParams()
    const flow = searchParams?.get('flow')
    const copy = flow === 'invite' ? COPY.invite : flow === 'recovery' ? COPY.recovery : COPY.default

    const [formError, setFormError] = useState<string | null>(null)
    const [redirecting, setRedirecting] = useState(false)

    const form = useForm<ChangePasswordFormData>({
        resolver: zodResolver(ChangePasswordFormSchema),
        defaultValues: { password: '', confirmPassword: '' },
    })
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = form

    const onSubmit = async ({ password }: ChangePasswordFormData) => {
        setFormError(null)
        const { error } = await getBrowserSupabase().auth.updateUser({ password })
        if (error) {
            setFormError(getUpdateErrorMessage(error))
            return
        }
        try {
            await apiMarkPasswordChanged()
        } catch (markError) {
            setFormError(`Your password was saved, but we couldn’t record it: ${tryGetErrorMessage(markError)}`)
            return
        }
        setRedirecting(true)
        window.location.assign(homePath)
    }

    return (
        <FormProvider {...form}>
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="mb-6 text-center">
                    <h4 className="heading-text">{copy.title}</h4>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">{copy.description}</p>
                    <p className="mt-3 inline-block rounded-xl bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        {email}
                    </p>
                </div>
                {formError && (
                    <Alert type="danger" showIcon duration={0} className="mb-4">
                        {formError}{' '}
                        <a href={signInPath} className="font-semibold underline">
                            Back to sign in
                        </a>
                    </Alert>
                )}
                <FormItem label="Password" invalid={!!errors.password} errorMessage={errors.password?.message}>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} type="password" autoComplete="new-password" autoFocus />
                        )}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{PASSWORD_RULE_HINT}</p>
                </FormItem>
                <FormItem
                    label="Confirm password"
                    invalid={!!errors.confirmPassword}
                    errorMessage={errors.confirmPassword?.message}
                >
                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => <Input {...field} type="password" autoComplete="new-password" />}
                    />
                </FormItem>
                <Button block variant="solid" type="submit" loading={isSubmitting || redirecting}>
                    {flow === 'recovery' ? 'Save new password' : 'Save password and continue'}
                </Button>
            </Form>
        </FormProvider>
    )
}
