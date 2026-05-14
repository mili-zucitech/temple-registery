import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock component to test the hook
import { useState, useEffect } from 'react'

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

interface TabPaginationState {
  currentPage: number;
  pageSize: number;
  statusFilter: StatusFilter;
}

function useTabPaginationState(tabKey: string): [TabPaginationState, (state: TabPaginationState) => void] {
  const [state, setState] = useState<TabPaginationState>(() => {
    try {
      const saved = sessionStorage.getItem(`pagination_${tabKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.currentPage === 'number' &&
          typeof parsed.pageSize === 'number' &&
          typeof parsed.statusFilter === 'string'
        ) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn(`Failed to parse pagination state for tab ${tabKey}:`, error);
    }
    
    return {
      currentPage: 1,
      pageSize: 20,
      statusFilter: 'ALL' as StatusFilter,
    };
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(`pagination_${tabKey}`, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to persist pagination state for tab ${tabKey}:`, error);
    }
  }, [state, tabKey]);

  return [state, setState];
}

describe('useTabPaginationState', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear()
  })

  afterEach(() => {
    // Clean up after each test
    sessionStorage.clear()
  })

  it('should initialize with default values when no saved state exists', () => {
    const { result } = renderHook(() => useTabPaginationState('ALL'))
    
    const [state] = result.current
    
    expect(state.currentPage).toBe(1)
    expect(state.pageSize).toBe(20)
    expect(state.statusFilter).toBe('ALL')
  })

  it('should persist state to sessionStorage when state changes', () => {
    const { result } = renderHook(() => useTabPaginationState('ALL'))
    
    act(() => {
      const [, setState] = result.current
      setState({
        currentPage: 3,
        pageSize: 20,
        statusFilter: 'ACTIVE',
      })
    })
    
    const saved = sessionStorage.getItem('pagination_ALL')
    expect(saved).toBeTruthy()
    
    const parsed = JSON.parse(saved!)
    expect(parsed.currentPage).toBe(3)
    expect(parsed.pageSize).toBe(20)
    expect(parsed.statusFilter).toBe('ACTIVE')
  })

  it('should restore state from sessionStorage on mount', () => {
    // Pre-populate sessionStorage
    const savedState = {
      currentPage: 5,
      pageSize: 20,
      statusFilter: 'INACTIVE',
    }
    sessionStorage.setItem('pagination_DC', JSON.stringify(savedState))
    
    const { result } = renderHook(() => useTabPaginationState('DC'))
    
    const [state] = result.current
    
    expect(state.currentPage).toBe(5)
    expect(state.pageSize).toBe(20)
    expect(state.statusFilter).toBe('INACTIVE')
  })

  it('should maintain separate state for different tab keys', () => {
    // Set state for 'ALL' tab
    const { result: result1 } = renderHook(() => useTabPaginationState('ALL'))
    act(() => {
      const [, setState] = result1.current
      setState({
        currentPage: 2,
        pageSize: 20,
        statusFilter: 'ACTIVE',
      })
    })
    
    // Set state for 'DC' tab
    const { result: result2 } = renderHook(() => useTabPaginationState('DC'))
    act(() => {
      const [, setState] = result2.current
      setState({
        currentPage: 4,
        pageSize: 20,
        statusFilter: 'INACTIVE',
      })
    })
    
    // Verify both states are independent
    const [state1] = result1.current
    const [state2] = result2.current
    
    expect(state1.currentPage).toBe(2)
    expect(state1.statusFilter).toBe('ACTIVE')
    
    expect(state2.currentPage).toBe(4)
    expect(state2.statusFilter).toBe('INACTIVE')
  })

  it('should use default values when sessionStorage contains invalid data', () => {
    // Store invalid JSON
    sessionStorage.setItem('pagination_INVALID', 'not valid json')
    
    const { result } = renderHook(() => useTabPaginationState('INVALID'))
    
    const [state] = result.current
    
    expect(state.currentPage).toBe(1)
    expect(state.pageSize).toBe(20)
    expect(state.statusFilter).toBe('ALL')
  })

  it('should use default values when sessionStorage contains incomplete data', () => {
    // Store incomplete data (missing statusFilter)
    sessionStorage.setItem('pagination_INCOMPLETE', JSON.stringify({
      currentPage: 3,
      pageSize: 20,
    }))
    
    const { result } = renderHook(() => useTabPaginationState('INCOMPLETE'))
    
    const [state] = result.current
    
    // Should fall back to defaults
    expect(state.currentPage).toBe(1)
    expect(state.pageSize).toBe(20)
    expect(state.statusFilter).toBe('ALL')
  })

  it('should update state correctly when setState is called multiple times', () => {
    const { result } = renderHook(() => useTabPaginationState('MULTI'))
    
    // First update
    act(() => {
      const [, setState] = result.current
      setState({
        currentPage: 2,
        pageSize: 20,
        statusFilter: 'ACTIVE',
      })
    })
    
    let [state] = result.current
    expect(state.currentPage).toBe(2)
    expect(state.statusFilter).toBe('ACTIVE')
    
    // Second update
    act(() => {
      const [, setState] = result.current
      setState({
        currentPage: 3,
        pageSize: 20,
        statusFilter: 'INACTIVE',
      })
    })
    
    ;[state] = result.current
    expect(state.currentPage).toBe(3)
    expect(state.statusFilter).toBe('INACTIVE')
  })

  it('should persist state with correct storage key format', () => {
    const tabKey = 'DISTRICT_COLLECTOR'
    const { result } = renderHook(() => useTabPaginationState(tabKey))
    
    act(() => {
      const [, setState] = result.current
      setState({
        currentPage: 7,
        pageSize: 20,
        statusFilter: 'ACTIVE',
      })
    })
    
    // Verify the key format is correct
    const storageKey = `pagination_${tabKey}`
    const saved = sessionStorage.getItem(storageKey)
    
    expect(saved).toBeTruthy()
    expect(sessionStorage.getItem('pagination_WRONG_KEY')).toBeNull()
  })
})
