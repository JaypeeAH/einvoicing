import 'server-only'

import type { ServerSupabase } from '@/server/supabase/server'
import { getOrganization } from '@/server/data/organizations'
import { listBranches } from '@/server/data/branches'
import { listSeries } from '@/server/data/series'
import { listRegistrations } from '@/server/data/registrations'
import { getLatestAssessment } from '@/server/data/assessments'
import { buildChecklist } from '@/utils/compliance/buildChecklist'
import { todayInManila } from '@/utils/date'
import type { ComplianceStatus } from '@/@types/compliance/ComplianceStatus'
import type { DocumentCategory } from '@/constants/bir.constant'

/** Everything the Compliance Center shows: coverage result, registrations and the readiness checklist. */
export const getComplianceStatus = async (
    supabase: ServerSupabase,
    organizationId: string,
): Promise<ComplianceStatus> => {
    const [organization, branches, series, registrations, assessment, documents] = await Promise.all([
        getOrganization(supabase, organizationId),
        listBranches(supabase, organizationId),
        listSeries(supabase, organizationId),
        listRegistrations(supabase, organizationId),
        getLatestAssessment(supabase, organizationId),
        supabase
            .from('compliance_documents')
            .select('category')
            .eq('organization_id', organizationId)
            .returns<{ category: DocumentCategory }[]>(),
    ])
    if (documents.error) throw documents.error

    const { checklist, score } = buildChecklist({
        organization,
        branches,
        series,
        registrations,
        documentCategories: [...new Set(documents.data.map((row) => row.category))],
        assessment,
        today: todayInManila(),
    })

    return { assessment, registrations, checklist, score }
}
