import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { getProductsSearchParams, type ProductsParams } from '@/@types/products'
import type { Collection } from '@/@types/collections'
import type { Product } from '@/@types/products/Product'
import type { ProductFormData } from '@/@types/products/forms/ProductFormData'

const productsPath = '/products'

const getProductsUrl = (params?: ProductsParams) => `${productsPath}${params ? getProductsSearchParams(params) : ''}`

export const apiGetProducts = (params?: ProductsParams) =>
    api.fetchJson<Collection<Product>>({ method: 'get', url: getProductsUrl(params) })

export const apiCreateProduct = (data: ProductFormData) =>
    api.fetchJson<Product>({ method: 'post', url: productsPath, data })

export const apiUpdateProduct = (productId: string, data: ProductFormData) =>
    api.fetchJson<Product>({ method: 'put', url: `${productsPath}/${productId}`, data })

export const apiDeleteProduct = (productId: string) =>
    api.fetchJson<void>({ method: 'delete', url: `${productsPath}/${productId}` })

export const useSWRProducts = (params: ProductsParams | null, config?: SWRConfiguration<Collection<Product>>) =>
    useSWR(
        params ? getProductsUrl(params) : null,
        (url: string) => api.fetchJson<Collection<Product>>({ method: 'get', url }),
        {
            keepPreviousData: true,
            ...config,
        },
    )
