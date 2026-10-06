import type { Metadata } from 'next'
import ProductsSWRProvider from '@/components/products/ProductsSWRProvider'
import ProductsClientPage from '@/components/products/ProductsClientPage'
import Forbidden from '@/components/shared/Forbidden'
import { canAccessPage } from '@/server/auth/guards'
import { ACTION_INVOICE_VIEW } from '@/constants/actions.constant'

export const metadata: Metadata = { title: 'Products & Services' }

export default async function ProductsPage() {
    if (!(await canAccessPage(ACTION_INVOICE_VIEW))) return <Forbidden />
    return (
        <ProductsSWRProvider>
            <ProductsClientPage />
        </ProductsSWRProvider>
    )
}
