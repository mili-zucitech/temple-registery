import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('should_renderTitleAndValue', () => {
    render(<KpiCard title="Total Temples" value={42} />)
    expect(screen.getByText('Total Temples')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should_renderValue_as_formatted_number', () => {
    render(<KpiCard title="Total" value={1500000} />)
    // The value should be present in some form (locale formatting varies by env)
    const formatted = (1500000).toLocaleString()
    expect(screen.getByText(formatted)).toBeInTheDocument()
  })

  it('should_renderStringValue', () => {
    render(<KpiCard title="Status" value="Active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should_renderTrendUp_when_trendDirectionIsUp', () => {
    render(
      <KpiCard
        title="Growth"
        value={10}
        trend={{ value: 12, label: 'vs last month', direction: 'up' }}
      />
    )
    expect(screen.getByText(/↑/)).toBeInTheDocument()
    expect(screen.getByText(/12%/)).toBeInTheDocument()
  })

  it('should_renderTrendDown_when_trendDirectionIsDown', () => {
    render(
      <KpiCard
        title="Decline"
        value={5}
        trend={{ value: 8, label: 'vs last month', direction: 'down' }}
      />
    )
    expect(screen.getByText(/↓/)).toBeInTheDocument()
  })

  it('should_renderNeutralTrend_when_directionIsNeutral', () => {
    render(
      <KpiCard
        title="Stable"
        value={5}
        trend={{ value: 0, label: 'no change', direction: 'neutral' }}
      />
    )
    expect(screen.getByText(/→/)).toBeInTheDocument()
  })

  it('should_renderDescription_when_provided', () => {
    render(<KpiCard title="Total" value={1} description="Approved this month" />)
    expect(screen.getByText('Approved this month')).toBeInTheDocument()
  })

  it('should_renderAsButton_and_callOnClick_when_onClickProvided', () => {
    const onClick = vi.fn()
    render(<KpiCard title="Clickable" value={3} onClick={onClick} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should_renderAsDivNotButton_when_noOnClick', () => {
    render(<KpiCard title="Static" value={3} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
