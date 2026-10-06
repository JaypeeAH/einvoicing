import type { PageParams } from '@/@types/collections'

export interface ProductsParams extends PageParams {
    active?: boolean
}

export const getProductsSearchParams = (params: ProductsParams) => {
    const search = new URLSearchParams()
    if (params.query) search.set('query', params.query)
    if (params.page) search.set('page', String(params.page))
    if (params.size) search.set('size', String(params.size))
    if (params.active !== undefined) search.set('active', String(params.active))
    const value = search.toString()
    return value ? `?${value}` : ''
}
