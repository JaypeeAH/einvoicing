import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import { getMemberNames } from '@/server/data/members'
import { assessCoverage } from '@/utils/compliance/assessCoverage'
import type { CoverageAnswers, CoverageAssessment, CoverageResult } from '@/@types/compliance/CoverageAssessment'

interface AssessmentRow {
    id: string
    answers: CoverageAnswers
    result: CoverageResult
    assessed_by: string | null
    created_at: string
}

export const getLatestAssessment = async (
    supabase: ServerSupabase,
    organizationId: string,
): Promise<CoverageAssessment | null> => {
    const { data, error } = await supabase
        .from('coverage_assessments')
        .select('id, answers, result, assessed_by, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<AssessmentRow>()
    if (error) throw error
    if (!data) return null
    const names = await getMemberNames(supabase, organizationId, data.assessed_by ? [data.assessed_by] : [])
    return {
        id: data.id,
        answers: data.answers,
        result: data.result,
        assessedByName: data.assessed_by ? (names.get(data.assessed_by) ?? null) : null,
        createdAt: data.created_at,
    }
}

/** Evaluates the answers on the server (never trusts a client-computed result) and keeps the history. */
export const createAssessment = async (supabase: ServerSupabase, organizationId: string, answers: CoverageAnswers) => {
    const result = assessCoverage(answers)
    const { error } = await supabase
        .from('coverage_assessments')
        .insert({ organization_id: organizationId, answers, result })
    if (error) throw error
    return getLatestAssessment(supabase, organizationId)
}
