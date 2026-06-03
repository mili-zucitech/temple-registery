import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

// Helper: a component that throws when render prop is true
function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test explosion')
  return <div>All good</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error from React error boundary logs during tests
  const originalConsoleError = console.error
  beforeEach(() => { console.error = vi.fn() })
  afterEach(() => { console.error = originalConsoleError })

  it('should_renderChildren_when_noError', () => {
    render(
      <ErrorBoundary>
        <div>Happy path content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Happy path content')).toBeInTheDocument()
  })

  it('should_renderFallback_when_childThrows', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test explosion')).toBeInTheDocument()
  })

  it('should_showRefreshButton_when_errorCaught', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument()
  })

  it('should_showFallbackUI_when_errorHasNoMessage', () => {
    function ThrowsBlank() {
      throw new Error('')
    }
    render(
      <ErrorBoundary>
        <ThrowsBlank />
      </ErrorBoundary>
    )
    // The heading and refresh button are always present when error is caught
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument()
  })
})
