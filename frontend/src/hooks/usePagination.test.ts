import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('should_startAtPageZero_byDefault', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.page).toBe(0)
  })

  it('should_useDefaultPageSize_when_notProvided', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.pageSize).toBeGreaterThan(0)
  })

  it('should_useCustomPageSize_when_provided', () => {
    const { result } = renderHook(() => usePagination(25))
    expect(result.current.pageSize).toBe(25)
  })

  it('should_updatePage_when_goToPageCalled', () => {
    const { result } = renderHook(() => usePagination())
    act(() => { result.current.goToPage(3) })
    expect(result.current.page).toBe(3)
  })

  it('should_resetToZero_when_resetPageCalled', () => {
    const { result } = renderHook(() => usePagination())
    act(() => { result.current.goToPage(5) })
    act(() => { result.current.resetPage() })
    expect(result.current.page).toBe(0)
  })

  it('should_goToPage_then_reset_cycle', () => {
    const { result } = renderHook(() => usePagination())
    act(() => { result.current.goToPage(2) })
    expect(result.current.page).toBe(2)
    act(() => { result.current.resetPage() })
    expect(result.current.page).toBe(0)
    act(() => { result.current.goToPage(7) })
    expect(result.current.page).toBe(7)
  })
})
