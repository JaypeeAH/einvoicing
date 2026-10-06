import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerSupabase } from '@/server/supabase/server'

/** Only same-site relative paths are allowed as the post-sign-in destination (prevents open redirects). */
const safeNext = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/')

/**
 * Landing page for links in Supabase emails (sign-up confirmation, invitation, password reset).
 * Exchanges the code or token for a session, activates pending invitations and continues to `next`.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const next = safeNext(searchParams.get('next'))
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    const supabase = await createServerSupabase()
    const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : tokenHash && type
          ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
          : { error: new Error('Missing code') }

    if (error) {
        return NextResponse.redirect(`${origin}/sign-in?error=link`)
    }

    await supabase.rpc('accept_invitations')
    return NextResponse.redirect(`${origin}${next}`)
}
