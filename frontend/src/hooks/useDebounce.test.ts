import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('should_notCallFnImmediately', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 300))
    act(() => { result.current('arg1') })
    expect(fn).not.toHaveBeenCalled()
  })

  it('should_callFnAfterDelay', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 300))
    act(() => {
      result.current('arg1')
      vi.advanceTimersByTime(300)
    })
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('arg1')
  })

  it('should_cancelPreviousCall_when_calledAgainBeforeDelay', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 300))
    act(() => {
      result.current('first')
      vi.advanceTimersByTime(100)
      result.current('second')
      vi.advanceTimersByTime(300)
    })
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('second')
  })

  it('should_callFnWithCorrectArgs', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 100))
    act(() => {
      result.current('hello', 'world')
      vi.advanceTimersByTime(100)
    })
    expect(fn).toHaveBeenCalledWith('hello', 'world')
  })

  it('should_callFnMultipleTimes_for_separateBursts', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 200))
    act(() => {
      result.current('burst1')
      vi.advanceTimersByTime(200)
    })
    act(() => {
      result.current('burst2')
      vi.advanceTimersByTime(200)
    })
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
