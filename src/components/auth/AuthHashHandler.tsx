'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'
import { getBrowserSupabase } from '@/services/supabase/browser'
import api from '@/services/api'
import { homePath, setPasswordPath, signInPath } from '@/configs/app.config'

/**
 * Rescues email links that carry the session in the URL fragment (`#access_token=…`), which Supabase uses
 * when a template links through `{{ .ConfirmationURL }}`. The fragment never reaches the server, so the
 * visitor would otherwise land signed-out on whichever page the link pointed at.
 *
 * It starts the session in the browser, activates any pending invitation, then continues to the right page.
 * Mounted on the pages those links can land on: the public homepage and the sign-in card.
 */
export default function AuthHashHandler() {
    const pathname = usePathname()
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        const hash = window.location.hash
        if (!hash || hash.length < 2) return

        const params = new URLSearchParams(hash.slice(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')
        const linkError = params.get('error_description') ?? params.get('error')

        if (!accessToken && !linkError) return

        // Take the tokens out of the address bar before anything else
        window.history.replaceState(null, '', window.location.pathname + window.location.search)

        if (linkError || !accessToken || !refreshToken) {
            window.location.replace(`${signInPath}?error=link`)
            return
        }

        void (async () => {
            setBusy(true)
            const { error } = await getBrowserSupabase().auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            })
            if (error) {
                window.location.replace(`${signInPath}?error=link`)
                return
            }
            try {
                await api.fetchJson({ method: 'post', url: '/auth/accept-invitations' })
            } catch {
                // The protected layout retries this on the next request
            }
            const destination = type === 'invite' || type === 'recovery' ? `${setPasswordPath}?flow=${type}` : homePath
            window.location.replace(destination)
        })()
    }, [pathname])

    if (!busy) return null

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/90 backdrop-blur-sm dark:bg-gray-950/90">
            <Spinner size={36} />
            <p className="font-semibold text-gray-600 dark:text-gray-300">Signing you in…</p>
        </div>
    )
}
