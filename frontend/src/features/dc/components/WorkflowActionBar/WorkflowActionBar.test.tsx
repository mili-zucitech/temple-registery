import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowActionBar } from '@/features/dc/components/WorkflowActionBar/WorkflowActionBar'

describe('WorkflowActionBar', () => {
  const noop = () => {}

  // ── canAct = true (DISTRICT_COLLECTOR / SUPER_ADMIN) ─────────────────────

  it('should_renderAllFourActionButtons_when_canActIsTrue', () => {
    render(
      <WorkflowActionBar
        canAct={true}
        onApprove={noop}
        onReject={noop}
        onClarify={noop}
        onFlagPhysical={noop}
      />,
    )

    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /request clarification/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /flag physical/i })).toBeInTheDocument()
  })

  it('should_callOnApprove_when_approveButtonIsClicked', () => {
    const onApprove = vi.fn()
    render(
      <WorkflowActionBar
        canAct={true}
        onApprove={onApprove}
        onReject={noop}
        onClarify={noop}
        onFlagPhysical={noop}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /approve/i }))
    expect(onApprove).toHaveBeenCalledOnce()
  })

  it('should_callOnReject_when_rejectButtonIsClicked', () => {
    const onReject = vi.fn()
    render(
      <WorkflowActionBar
        canAct={true}
        onApprove={noop}
        onReject={onReject}
        onClarify={noop}
        onFlagPhysical={noop}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /reject/i }))
    expect(onReject).toHaveBeenCalledOnce()
  })

  it('should_callOnClarify_when_clarifyButtonIsClicked', () => {
    const onClarify = vi.fn()
    render(
      <WorkflowActionBar
        canAct={true}
        onApprove={noop}
        onReject={noop}
        onClarify={onClarify}
        onFlagPhysical={noop}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /request clarification/i }))
    expect(onClarify).toHaveBeenCalledOnce()
  })

  it('should_callOnFlagPhysical_when_flagPhysicalButtonIsClicked', () => {
    const onFlagPhysical = vi.fn()
    render(
      <WorkflowActionBar
        canAct={true}
        onApprove={noop}
        onReject={noop}
        onClarify={noop}
        onFlagPhysical={onFlagPhysical}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /flag physical/i }))
    expect(onFlagPhysical).toHaveBeenCalledOnce()
  })

  it('should_disableAllButtons_when_isSubmittingIsTrue', () => {
    render(
      <WorkflowActionBar
        canAct={true}
        isSubmitting={true}
        onApprove={noop}
        onReject={noop}
        onClarify={noop}
        onFlagPhysical={noop}
      />,
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  // ── canAct = false (DC_STAFF) ─────────────────────────────────────────────

  it('should_renderReadOnlyNotice_when_canActIsFalse', () => {
    render(
      <WorkflowActionBar
        canAct={false}
        onApprove={noop}
        onReject={noop}
        onClarify={noop}
        onFlagPhysical={noop}
      />,
    )

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
    expect(screen.getByText(/read-only access/i)).toBeInTheDocument()
  })
})