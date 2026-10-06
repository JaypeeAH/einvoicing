import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabasePublishableKey, supabaseUrl } from '@/configs/supabase.config'

/** Pages anyone can open. Everything else requires a signed-in user. */
const PUBLIC_PATHS = ['/welcome', '/sign-in', '/sign-up', '/forgot-password', '/auth/']

const isPublicPath = (pathname: string) => PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path))

/**
 * Refreshes the Supabase session cookie on every request. Signed-out visitors see the public homepage at
 * `/` and are sent to the sign-in page for anything else. API routes answer 401 themselves; organization
 * membership and roles are checked by the protected layout, the API handlers and row-level security.
 */
export async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request })

    if (!supabaseUrl || !supabasePublishableKey) {
        return response
    }

    const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet, headers) => {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                response = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value))
            },
        },
    })

    // Do not run code between createServerClient and getUser — it refreshes the session.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname, search } = request.nextUrl

    if (!user && pathname === '/') {
        return NextResponse.rewrite(new URL('/welcome', request.url), { headers: response.headers })
    }

    if (!user && !isPublicPath(pathname) && !pathname.startsWith('/api/')) {
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        url.search = `?next=${encodeURIComponent(pathname + search)}`
        return NextResponse.redirect(url)
    }

    if (user && (pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/welcome')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        url.search = ''
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        // Everything except static files and images
        '/((?!_next/static|_next/image|favicon.ico|img/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
