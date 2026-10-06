import 'server-only'

import { apiAuthHandler, parseJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createAssessment } from '@/server/data/assessments'
import { CoverageAnswersSchema } from '@/@types/compliance/CoverageAssessment'
import { ACTION_COMPLIANCE_MANAGE } from '@/constants/actions.constant'

/** Saves the e-invoicing coverage answers; the result is computed on the server. */
export const POST = apiAuthHandler(
    async (req, _ctx, { supabase, organizationId }) => {
        const answers = await parseJsonBody(req, CoverageAnswersSchema)
        return getJsonResponse(await createAssessment(supabase, organizationId, answers), { status: 201 })
    },
    { action: ACTION_COMPLIANCE_MANAGE },
)
