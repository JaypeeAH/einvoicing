import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import type { Registration } from '@/@types/registrations/Registration'
import type { RegistrationFormData } from '@/@types/registrations/forms/RegistrationFormData'

const registrationsPath = '/registrations'

export const apiCreateRegistration = (data: RegistrationFormData) =>
    api.fetchJson<Registration>({ method: 'post', url: registrationsPath, data })

export const apiUpdateRegistration = (registrationId: string, data: RegistrationFormData) =>
    api.fetchJson<Registration>({ method: 'put', url: `${registrationsPath}/${registrationId}`, data })

export const apiDeleteRegistration = (registrationId: string) =>
    api.fetchJson<void>({ method: 'delete', url: `${registrationsPath}/${registrationId}` })

export const useSWRRegistrations = (config?: SWRConfiguration<Registration[]>) =>
    useSWR(registrationsPath, (url: string) => api.fetchJson<Registration[]>({ method: 'get', url }), config)
