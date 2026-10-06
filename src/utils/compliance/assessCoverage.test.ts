import { describe, expect, it } from 'vitest'
import { assessCoverage } from './assessCoverage'
import type { CoverageAnswers } from '@/@types/compliance/CoverageAssessment'

const base: CoverageAnswers = {
    taxpayerSize: 'small',
    sellsOnline: false,
    isLargeTaxpayerService: false,
    usesCasOrInvoicingSoftware: false,
    isExporter: false,
    isRegisteredBusinessEnterprise: false,
    usesPosOnly: false,
}

describe('assessCoverage', () => {
    it('needs the taxpayer classification first', () => {
        expect(assessCoverage({ ...base, taxpayerSize: null }).status).toBe('incomplete')
    })

    it('exempts micro taxpayers even when they sell online', () => {
        expect(assessCoverage({ ...base, taxpayerSize: 'micro', sellsOnline: true }).status).toBe('exempt')
    })

    it('requires small online sellers by December 31, 2026', () => {
        const result = assessCoverage({ ...base, sellsOnline: true })
        expect(result.status).toBe('required')
        expect(result.deadline).toBe('2026-12-31')
    })

    it('requires CAS / invoicing software users', () => {
        expect(assessCoverage({ ...base, taxpayerSize: 'medium', usesCasOrInvoicingSoftware: true }).status).toBe(
            'required',
        )
    })

    it('requires large taxpayers', () => {
        expect(assessCoverage({ ...base, taxpayerSize: 'large' }).status).toBe('required')
    })

    it('defers exporters that do not use CAS to a later issuance', () => {
        expect(assessCoverage({ ...base, isExporter: true }).status).toBe('future')
    })

    it('treats exporters that use CAS as covered now', () => {
        expect(assessCoverage({ ...base, isExporter: true, usesCasOrInvoicingSoftware: true }).status).toBe('required')
    })

    it('waits for unanswered questions before concluding', () => {
        expect(assessCoverage({ ...base, sellsOnline: null }).status).toBe('incomplete')
    })

    it('marks everyone else as voluntary', () => {
        expect(assessCoverage(base).status).toBe('voluntary')
    })
})
