import api from '@/services/api'

/** Switches the organization the user works in, then reloads so every view uses it. */
export const apiSwitchOrganization = (organizationId: string) =>
    api.fetchJson<void>({ method: 'post', url: '/organizations/switch', data: { organizationId } })

/** Records a password change (resets the 30-day rotation clock). */
export const apiMarkPasswordChanged = () => api.fetchJson<void>({ method: 'post', url: '/account/password-changed' })
