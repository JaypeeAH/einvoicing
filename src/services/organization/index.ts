import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import type { Organization } from '@/@types/organizations/Organization'
import type {
    OrganizationFormData,
    OrganizationSettingsFormData,
} from '@/@types/organizations/forms/OrganizationFormData'

const organizationPath = '/organization'

/** Onboarding: registers a new taxpayer organization (the caller becomes its owner). */
export const apiCreateOrganization = (data: OrganizationFormData) =>
    api.fetchJson<{ id: string }>({ method: 'post', url: '/organizations', data })

export const apiUpdateOrganization = (data: OrganizationSettingsFormData) =>
    api.fetchJson<Organization>({ method: 'put', url: organizationPath, data })

export const useSWROrganization = (config?: SWRConfiguration<Organization>) =>
    useSWR(organizationPath, (url: string) => api.fetchJson<Organization>({ method: 'get', url }), config)
