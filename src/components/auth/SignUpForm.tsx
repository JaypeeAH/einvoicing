'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthError } from '@supabase/supabase-js'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { getBrowserSupabase } from '@/services/supabase/browser'
import { SignUpFormSchema, type SignUpFormData } from '@/@types/auth/forms/SignUpFormData'
import { PASSWORD_RULE_HINT } from '@/@types/auth/forms/PasswordSchema'
import { onboardingPath, signInPath } from '@/configs/app.config'

const getSignUpErrorMessage = (error: AuthError) => {
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
        return 'An account with this email already exists. Sign in instead, or reset your password.'
    }
    if (error.code === 'weak_password') {
        return 'That password is too easy to guess. Try a longer one with letters and numbers.'
    }
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
        return 'Too many attempts. Please wait a few minutes and try again.'
    }
    return 'We couldn’t create your account. Please try again.'
}

/** Creates a user account. Continues to onboarding, or asks the user to confirm their email first. */
export default function SignUpForm() {
    const [formError, setFormError] = useState<string | null>(null)
    const [sentTo, setSentTo] = useState<string | null>(null)
    const [redirecting, setRedirecting] = useState(false)

    const form = useForm<SignUpFormData>({
        resolver: zodResolver(SignUpFormSchema),
        defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
    })
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = form

    const onSubmit = async ({ fullName, email, password }: SignUpFormData) => {
        setFormError(null)
        const { data, error } = await getBrowserSupabase().auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: `${window.location.origin}/auth/callback?next=${onboardingPath}`,
            },
        })
        if (error) {
            setFormError(getSignUpErrorMessage(error))
            return
        }
        if (data.session) {
            setRedirecting(true)
            window.location.assign(onboardingPath)
            return
        }
        setSentTo(email)
    }

    if (sentTo) {
        return (
            <div>
                <Alert type="success" showIcon duration={0} title="Check your email to confirm your account">
                    <span className="font-normal">
                        We sent a confirmation link to <strong>{sentTo}</strong>. Open it to finish setting up your
                        account and register your business.
                    </span>
                </Alert>
                <p className="mt-6 text-center text-gray-500 dark:text-gray-400">
                    Didn’t get it? Check your spam folder, or{' '}
                    <button
                        type="button"
                        className="font-semibold text-primary hover:underline"
                        onClick={() => setSentTo(null)}
                    >
                        try again
                    </button>
                    .
                </p>
                <p className="mt-2 text-center text-gray-500 dark:text-gray-400">
                    Already confirmed?{' '}
                    <Link href={signInPath} className="font-semibold text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        )
    }

    return (
        <FormProvider {...form}>
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                {formError && (
                    <Alert type="danger" showIcon duration={0} className="mb-4">
                        {formError}
                    </Alert>
                )}
                <FormItem label="Full name" invalid={!!errors.fullName} errorMessage={errors.fullName?.message}>
                    <Controller
                        name="fullName"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} autoComplete="name" placeholder="Juan dela Cruz" autoFocus />
                        )}
                    />
                </FormItem>
                <FormItem label="Email" invalid={!!errors.email} errorMessage={errors.email?.message}>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} type="email" autoComplete="email" placeholder="you@business.ph" />
                        )}
                    />
                </FormItem>
                <FormItem label="Password" invalid={!!errors.password} errorMessage={errors.password?.message}>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => <Input {...field} type="password" autoComplete="new-password" />}
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
                    Create account
                </Button>
                <p className="mt-6 text-center text-gray-500 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link href={signInPath} className="font-semibold text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </Form>
        </FormProvider>
    )
}
