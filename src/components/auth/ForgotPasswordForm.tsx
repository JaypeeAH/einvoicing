'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { getBrowserSupabase } from '@/services/supabase/browser'
import { ForgotPasswordFormSchema, type ForgotPasswordFormData } from '@/@types/auth/forms/ForgotPasswordFormData'
import { setPasswordPath, signInPath } from '@/configs/app.config'

/**
 * Sends a password reset link. Always shows the same message so the page never reveals whether an email
 * has an account.
 */
export default function ForgotPasswordForm() {
    const [sent, setSent] = useState(false)

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(ForgotPasswordFormSchema),
        defaultValues: { email: '' },
    })
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = form

    const onSubmit = async ({ email }: ForgotPasswordFormData) => {
        try {
            await getBrowserSupabase().auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=${setPasswordPath}`,
            })
        } catch {
            // Same message either way — see above
        }
        setSent(true)
    }

    return (
        <FormProvider {...form}>
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                {sent ? (
                    <Alert type="success" showIcon duration={0} className="mb-6">
                        <span className="font-normal">
                            If an account exists for that email, we’ve sent a link to reset your password. Check your
                            inbox and spam folder.
                        </span>
                    </Alert>
                ) : (
                    <>
                        <FormItem label="Email" invalid={!!errors.email} errorMessage={errors.email?.message}>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@business.ph"
                                        autoFocus
                                    />
                                )}
                            />
                        </FormItem>
                        <Button block variant="solid" type="submit" loading={isSubmitting}>
                            Send reset link
                        </Button>
                    </>
                )}
                <p className="mt-6 text-center text-gray-500 dark:text-gray-400">
                    Remembered it?{' '}
                    <Link href={signInPath} className="font-semibold text-primary hover:underline">
                        Back to sign in
                    </Link>
                </p>
            </Form>
        </FormProvider>
    )
}
