'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ProductForm from '@/components/products/forms/ProductForm'
import { apiCreateProduct, apiUpdateProduct } from '@/services/products'
import type { Product } from '@/@types/products/Product'
import type { ProductFormData } from '@/@types/products/forms/ProductFormData'

interface ProductDialogProps {
    isOpen: boolean
    product?: Product | null
    onClose: () => void
    onSaved: (product: Product) => void
}

const FORM_ID = 'product-form'

/** Add or edit a product or service. */
export default function ProductDialog({ isOpen, product, onClose, onSaved }: ProductDialogProps) {
    const [saving, setSaving] = useState(false)

    const onSubmit = async (data: ProductFormData) => {
        setSaving(true)
        try {
            const saved = product ? await apiUpdateProduct(product.id, data) : await apiCreateProduct(data)
            toastSuccess(product ? 'Item updated.' : 'Item added.')
            onSaved(saved)
        } catch (error) {
            toastError('Could not save the item.', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} width={640} onClose={onClose} onRequestClose={onClose} closable={!saving}>
            <h4 className="heading-text mb-1">{product ? 'Edit item' : 'Add product or service'}</h4>
            <p className="mb-5 text-gray-500">
                The price and tax treatment are defaults — you can change them on each invoice line.
            </p>
            {isOpen && <ProductForm key={product?.id ?? 'new'} id={FORM_ID} product={product} onSubmit={onSubmit} />}
            <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" form={FORM_ID} loading={saving}>
                    {product ? 'Save changes' : 'Add item'}
                </Button>
            </div>
        </Dialog>
    )
}
