/** Standard paginated response: one page of `records` out of `total` matches. */
export interface Collection<T> {
    total: number
    records: T[]
}

export interface SortOrder {
    key: string
    direction: 'asc' | 'desc'
}

export interface PageParams {
    page?: number
    size?: number
    query?: string
}
