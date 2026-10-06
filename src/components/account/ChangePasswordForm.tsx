'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthError } from '@supabase/supabase-js'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { toastSuccess } from '@/components/ui/toast/toast'
import { getBrowserSupabase } from '@/services/supabase/browser'
import { apiMarkPasswordChanged } from '@/services/session'
import { tryGetErrorMessage } from '@/utils/errors'
import { ChangePasswordFormSchema, type ChangePasswordFormData } from '@/@types/auth/forms/ChangePasswordFormData'
import { PASSWORD_RULE_HINT } from '@/@types/auth/forms/PasswordSchema'
import { PASSWORD_MAX_AGE_DAYS } from '@/constants/bir.constant'
import { accountPath, homePath } from '@/configs/app.config'

const getUpdateErrorMessage = (error: AuthError) => {
    if (error.code === 'same_password') return 'Choose a password that’s different from your current one.'
    if (error.code === 'weak_password')
        return 'That password is too easy to guess. Try a longer one with letters and numbers.'
    if (error.code === 'session_not_found' || error.status === 401) {
        return 'Your session has expired. Sign in again (or request a new reset link) and try once more.'
    }
    return 'We couldn’t change your password. Please try again.'
}

/** Sets a new password, then restarts the 30-day rotation clock. `?expired=1` explains why it is required. */
export default function ChangePasswordForm() {
    const searchParams = useSearchParams()
    const expired = searchParams?.get('expired') === '1'

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
            setFormError(`Your password was changed, but we couldn’t record it: ${tryGetErrorMessage(markError)}`)
            return
        }
        toastSuccess('Your password has been changed.')
        setRedirecting(true)
        window.location.assign(homePath)
    }

    return (
        <FormProvider {...form}>
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                {expired && (
                    <Alert type="warning" showIcon duration={0} className="mb-4">
                        Your password is more than {PASSWORD_MAX_AGE_DAYS} days old. BIR’s CAS security standard
                        requires changing it every {PASSWORD_MAX_AGE_DAYS} days.
                    </Alert>
                )}
                {formError && (
                    <Alert type="danger" showIcon duration={0} className="mb-4">
                        {formError}
                    </Alert>
                )}
                <FormItem label="New password" invalid={!!errors.password} errorMessage={errors.password?.message}>
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
                    label="Confirm new password"
                    invalid={!!errors.confirmPassword}
                    errorMessage={errors.confirmPassword?.message}
                >
                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => <Input {...field} type="password" autoComplete="new-password" />}
                    />
                </FormItem>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {!expired ? (
                        <Link
                            href={accountPath}
                            className="text-center text-sm font-semibold text-primary hover:underline"
                        >
                            Back to my account
                        </Link>
                    ) : (
                        <span />
                    )}
                    <Button variant="solid" type="submit" loading={isSubmitting || redirecting}>
                        Change password
                    </Button>
                </div>
            </Form>
        </FormProvider>
    )
}
