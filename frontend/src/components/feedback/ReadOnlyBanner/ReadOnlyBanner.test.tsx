import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ReadOnlyBanner } from './ReadOnlyBanner'

describe('ReadOnlyBanner', () => {
  it('should_render_default_message_when_no_props_provided', () => {
    render(<ReadOnlyBanner />)
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText(/read-only mode/i)).toBeDefined()
  })

  it('should_render_custom_message_when_provided', () => {
    render(<ReadOnlyBanner message="Custom read-only message for test." />)
    expect(screen.getByText('Custom read-only message for test.')).toBeDefined()
  })

  it('should_render_roleLabel_badge_when_provided', () => {
    render(<ReadOnlyBanner roleLabel="Auditor" />)
    expect(screen.getByText('Auditor')).toBeDefined()
  })

  it('should_not_render_roleLabel_when_not_provided', () => {
    render(<ReadOnlyBanner />)
    // No badge text for role label
    expect(screen.queryByText('Auditor')).toBeNull()
  })
})
