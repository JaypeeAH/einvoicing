import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import type { ComplianceStatus } from '@/@types/compliance/ComplianceStatus'
import type { CoverageAnswers, CoverageAssessment } from '@/@types/compliance/CoverageAssessment'

const compliancePath = '/compliance'

/** Saves coverage answers; the server computes and stores the result. */
export const apiCreateAssessment = (answers: CoverageAnswers) =>
    api.fetchJson<CoverageAssessment>({ method: 'post', url: `${compliancePath}/assessments`, data: answers })

export const useSWRComplianceStatus = (config?: SWRConfiguration<ComplianceStatus>) =>
    useSWR(compliancePath, (url: string) => api.fetchJson<ComplianceStatus>({ method: 'get', url }), config)
