'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { getBrowserSupabase } from '@/services/supabase/browser'
import { SignInFormSchema, type SignInFormData } from '@/@types/auth/forms/SignInFormData'
import { forgotPasswordPath, homePath, signUpPath } from '@/configs/app.config'

/** Only same-site relative paths are accepted as the destination after signing in (prevents open redirects). */
const getSafeNext = (value: string | null | undefined) =>
    value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : homePath

/** Email and password sign in. Returns to `?next=` afterwards; `?error=link` explains an expired email link. */
export default function SignInForm() {
    const searchParams = useSearchParams()
    const next = getSafeNext(searchParams?.get('next'))
    const linkError = searchParams?.get('error') === 'link'

    const [formError, setFormError] = useState<string | null>(null)
    const [redirecting, setRedirecting] = useState(false)

    const form = useForm<SignInFormData>({
        resolver: zodResolver(SignInFormSchema),
        defaultValues: { email: '', password: '' },
    })
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = form

    const onSubmit = async ({ email, password }: SignInFormData) => {
        setFormError(null)
        const { error } = await getBrowserSupabase().auth.signInWithPassword({ email, password })
        if (error) {
            // Never say whether the email exists — only distinguish "can't reach the server" from a failed sign in
            setFormError(
                error.name === 'AuthRetryableFetchError' || (error.status ?? 0) >= 500
                    ? 'We couldn’t reach the sign-in service. Check your connection and try again.'
                    : 'Incorrect email or password.',
            )
            return
        }
        setRedirecting(true)
        window.location.assign(next)
    }

    return (
        <FormProvider {...form}>
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                {linkError && !formError && (
                    <Alert type="warning" showIcon duration={0} className="mb-4">
                        That link is invalid or has expired. Sign in, or request a new link.
                    </Alert>
                )}
                {formError && (
                    <Alert type="danger" showIcon duration={0} className="mb-4">
                        {formError}
                    </Alert>
                )}
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
                <FormItem label="Password" invalid={!!errors.password} errorMessage={errors.password?.message}>
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => <Input {...field} type="password" autoComplete="current-password" />}
                    />
                </FormItem>
                <div className="-mt-2 mb-6 flex justify-end">
                    <Link href={forgotPasswordPath} className="text-sm font-semibold text-primary hover:underline">
                        Forgot password?
                    </Link>
                </div>
                <Button block variant="solid" type="submit" loading={isSubmitting || redirecting}>
                    Sign in
                </Button>
                <p className="mt-6 text-center text-gray-500 dark:text-gray-400">
                    New here?{' '}
                    <Link href={signUpPath} className="font-semibold text-primary hover:underline">
                        Create an account
                    </Link>
                </p>
            </Form>
        </FormProvider>
    )
}
