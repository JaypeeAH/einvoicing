import type { Metadata, Viewport } from 'next'
import ThemeProvider from '@/components/template/Theme/ThemeProvider'
import SWRAppConfig from '@/components/swr/SWRAppConfig'
import { getTheme } from '@/server/actions/theme'
import { portalDescription, portalName } from '@/configs/app.config'
import 'simplebar-react/dist/simplebar.min.css'
import '@/assets/styles/app.css'

export const metadata: Metadata = {
    title: { default: portalName, template: `%s · ${portalName}` },
    description: portalDescription,
    robots: { index: false, follow: false },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
    const theme = await getTheme()
    return (
        <html lang="en-PH" className={theme.mode === 'dark' ? 'dark' : 'light'} suppressHydrationWarning>
            <body>
                <ThemeProvider theme={theme}>
                    <SWRAppConfig>{children}</SWRAppConfig>
                </ThemeProvider>
            </body>
        </html>
    )
}
