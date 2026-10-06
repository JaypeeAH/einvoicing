import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { getCustomersSearchParams, type CustomersParams } from '@/@types/customers'
import type { Collection } from '@/@types/collections'
import type { Customer } from '@/@types/customers/Customer'
import type { CustomerFormData } from '@/@types/customers/forms/CustomerFormData'

const customersPath = '/customers'

const getCustomersUrl = (params?: CustomersParams) =>
    `${customersPath}${params ? getCustomersSearchParams(params) : ''}`

export const apiGetCustomers = (params?: CustomersParams) =>
    api.fetchJson<Collection<Customer>>({ method: 'get', url: getCustomersUrl(params) })

export const apiCreateCustomer = (data: CustomerFormData) =>
    api.fetchJson<Customer>({ method: 'post', url: customersPath, data })

export const apiUpdateCustomer = (customerId: string, data: CustomerFormData) =>
    api.fetchJson<Customer>({ method: 'put', url: `${customersPath}/${customerId}`, data })

export const apiDeleteCustomer = (customerId: string) =>
    api.fetchJson<void>({ method: 'delete', url: `${customersPath}/${customerId}` })

export const useSWRCustomers = (params: CustomersParams | null, config?: SWRConfiguration<Collection<Customer>>) =>
    useSWR(
        params ? getCustomersUrl(params) : null,
        (url: string) => api.fetchJson<Collection<Customer>>({ method: 'get', url }),
        {
            keepPreviousData: true,
            ...config,
        },
    )
