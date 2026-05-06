import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('should_render_title_and_description_when_open', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Deactivate John Doe?"
        description="This will revoke access."
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByText('Deactivate John Doe?')).toBeDefined()
    expect(screen.getByText('This will revoke access.')).toBeDefined()
  })

  it('should_not_render_when_not_open', () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={vi.fn()}
        title="Should not render"
        description="Should not appear"
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.queryByText('Should not render')).toBeNull()
  })

  it('should_call_onConfirm_when_confirm_button_clicked', async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Confirm action?"
        description="This is irreversible."
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />,
    )
    const confirmBtn = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(confirmBtn)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should_call_onOpenChange_with_false_when_cancel_is_clicked', () => {
    const onOpenChange = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Confirm?"
        description="Are you sure?"
        onConfirm={vi.fn()}
      />,
    )
    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtn)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
