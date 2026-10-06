import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import type { Branch } from '@/@types/branches/Branch'
import type { BranchFormData } from '@/@types/branches/forms/BranchFormData'

const branchesPath = '/branches'

export const apiCreateBranch = (data: BranchFormData) =>
    api.fetchJson<Branch>({ method: 'post', url: branchesPath, data })

export const apiUpdateBranch = (branchId: string, data: BranchFormData) =>
    api.fetchJson<Branch>({ method: 'put', url: `${branchesPath}/${branchId}`, data })

export const useSWRBranches = (config?: SWRConfiguration<Branch[]>) =>
    useSWR(branchesPath, (url: string) => api.fetchJson<Branch[]>({ method: 'get', url }), config)
