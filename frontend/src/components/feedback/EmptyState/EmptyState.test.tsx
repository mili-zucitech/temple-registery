import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('should_renderTitle_always', () => {
    render(<EmptyState title="No records found" />)
    expect(screen.getByText('No records found')).toBeInTheDocument()
  })

  it('should_renderDescription_when_provided', () => {
    render(<EmptyState title="Empty" description="Try adjusting your filters." />)
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument()
  })

  it('should_notRenderDescription_when_omitted', () => {
    render(<EmptyState title="Empty" />)
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
  })

  it('should_renderIcon_when_provided', () => {
    render(<EmptyState title="Empty" icon={<span data-testid="icon">🔍</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('should_renderActionButton_when_actionProvided', () => {
    const onClick = vi.fn()
    render(<EmptyState title="Empty" action={{ label: 'Create New', onClick }} />)
    const btn = screen.getByRole('button', { name: /create new/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should_notRenderActionButton_when_noActionProvided', () => {
    render(<EmptyState title="Empty" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
