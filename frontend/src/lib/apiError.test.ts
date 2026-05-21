import { describe, it, expect } from 'vitest'
import { extractApiErrorMessage } from './apiError'

describe('extractApiErrorMessage', () => {
  it('should_returnFallback_when_errorIsNull', () => {
    expect(extractApiErrorMessage(null)).toBe(
      'An unexpected error occurred. Please try again.',
    )
  })

  it('should_returnFallback_when_errorIsUndefined', () => {
    expect(extractApiErrorMessage(undefined)).toBe(
      'An unexpected error occurred. Please try again.',
    )
  })

  it('should_returnCustomFallback_when_errorIsNullAndFallbackProvided', () => {
    expect(extractApiErrorMessage(null, 'Custom fallback')).toBe('Custom fallback')
  })

  it('should_returnBackendMessage_when_errorDataHasMessage', () => {
    const error = { data: { message: 'Trust registration number already exists.' } }
    expect(extractApiErrorMessage(error)).toBe('Trust registration number already exists.')
  })

  it('should_returnValidationErrors_when_errorsArray', () => {
    const error = {
      data: {
        errors: [
          { message: 'Name is required.' },
          { message: 'Email is invalid.' },
        ],
      },
    }
    expect(extractApiErrorMessage(error)).toBe('Name is required.. Email is invalid.')
  })

  it('should_returnValidationErrors_when_errorsAreStrings', () => {
    const error = {
      data: {
        errors: ['Name is required.', 'Email is invalid.'],
      },
    }
    expect(extractApiErrorMessage(error)).toBe('Name is required.. Email is invalid.')
  })

  it('should_returnValidationErrors_when_errorsHaveDefaultMessage', () => {
    const error = {
      data: {
        errors: [{ defaultMessage: 'Size must be between 2 and 100' }],
      },
    }
    expect(extractApiErrorMessage(error)).toBe('Size must be between 2 and 100')
  })

  it('should_returnDataError_when_noMessageButErrorField', () => {
    const error = { data: { error: 'Bad Request' } }
    expect(extractApiErrorMessage(error)).toBe('Bad Request')
  })

  it('should_returnNetworkError_when_fetchFailed', () => {
    const error = { error: 'TypeError: Failed to fetch' }
    expect(extractApiErrorMessage(error)).toBe(
      'Network error. Please check your connection and try again.',
    )
  })

  it('should_returnNetworkError_when_networkError', () => {
    const error = { error: 'NetworkError when attempting to fetch resource.' }
    expect(extractApiErrorMessage(error)).toBe(
      'Network error. Please check your connection and try again.',
    )
  })

  it('should_returnErrorString_when_nonNetworkErrorString', () => {
    const error = { error: 'PARSING_ERROR' }
    expect(extractApiErrorMessage(error)).toBe('PARSING_ERROR')
  })

  it('should_returnErrorMessage_when_jsErrorInstance', () => {
    const error = new Error('Something went wrong')
    expect(extractApiErrorMessage(error)).toBe('Something went wrong')
  })

  it('should_returnFallback_when_unknownErrorShape', () => {
    const error = { status: 500 }
    expect(extractApiErrorMessage(error, 'Server error')).toBe('Server error')
  })

  it('should_skipEmptyBackendMessage_and_checkValidationErrors', () => {
    const error = {
      data: {
        message: '',
        errors: [{ message: 'Field required' }],
      },
    }
    expect(extractApiErrorMessage(error)).toBe('Field required')
  })
})
