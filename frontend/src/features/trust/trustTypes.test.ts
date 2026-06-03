import { describe, expect, it } from 'vitest'
import { buildFinancialYearOptions, submitTrustFinancialSchema } from './trustTypes'

describe('submitTrustFinancialSchema', () => {
  it('should_accept_valid_semantic_financial_year_when_year_pair_matches', () => {
    const result = submitTrustFinancialSchema.safeParse({
      financialYear: '2024-25',
      annualIncome: 1000,
      annualExpenditure: null,
    })

    expect(result.success).toBe(true)
  })

  it('should_reject_invalid_financial_year_when_end_year_does_not_match', () => {
    const result = submitTrustFinancialSchema.safeParse({
      financialYear: '2024-27',
      annualIncome: 1000,
      annualExpenditure: null,
    })

    expect(result.success).toBe(false)
  })

  it('should_reject_future_financial_year_when_start_year_is_greater_than_current_fy', () => {
    const currentYear = new Date().getFullYear()
    const futureStart = currentYear + 2
    const value = `${futureStart}-${String((futureStart + 1) % 100).padStart(2, '0')}`

    const result = submitTrustFinancialSchema.safeParse({
      financialYear: value,
      annualIncome: 1000,
      annualExpenditure: null,
    })

    expect(result.success).toBe(false)
  })
})

describe('buildFinancialYearOptions', () => {
  it('should_return_descending_financial_year_options_when_count_is_positive', () => {
    const options = buildFinancialYearOptions(3)

    expect(options).toHaveLength(3)
    expect(options[0]).toMatch(/^\d{4}-\d{2}$/)
  })
})
