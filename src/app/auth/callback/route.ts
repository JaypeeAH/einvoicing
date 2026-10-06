import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerSupabase } from '@/server/supabase/server'
import { homePath, onboardingPath, setPasswordPath, signInPath } from '@/configs/app.config'

/** Only same-site relative paths are allowed as the destination (prevents open redirects). */
const safeNext = (value: string | null) =>
    value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : null

/**
 * Where to send the visitor once the link has been verified. Invitations and password resets always end at
 * the "set your password" page — the account has no usable password until then.
 */
const getDestination = (type: EmailOtpType | null, next: string | null) => {
    if (type === 'invite') return `${setPasswordPath}?flow=invite`
    if (type === 'recovery') return `${setPasswordPath}?flow=recovery`
    return next ?? (type === 'signup' || type === 'email' ? onboardingPath : homePath)
}

/**
 * Landing page for the links in Supabase emails (sign-up confirmation, invitation, password reset, email
 * change). Verifies the link, starts the session, activates pending invitations and continues.
 *
 * Supabase templates must link here with `token_hash` and `type` — see docs/email-templates/README.md.
 * Links built from the older `{{ .ConfirmationURL }}` variable put the session in the URL fragment instead,
 * which never reaches the server; `AuthHashHandler` picks those up in the browser.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const next = safeNext(searchParams.get('next'))
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    // Supabase reports expired or already-used links on the query string
    const linkError = searchParams.get('error_description') ?? searchParams.get('error')
    if (linkError) {
        return NextResponse.redirect(`${origin}${signInPath}?error=link`)
    }

    if (!code && !tokenHash) {
        return NextResponse.redirect(`${origin}${signInPath}?error=link`)
    }

    const supabase = await createServerSupabase()
    const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.verifyOtp({ token_hash: tokenHash as string, type: type ?? 'email' })

    if (error) {
        return NextResponse.redirect(`${origin}${signInPath}?error=link`)
    }

    await supabase.rpc('accept_invitations')
    return NextResponse.redirect(`${origin}${getDestination(type, next)}`)
}
