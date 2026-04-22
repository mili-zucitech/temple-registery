import React from 'react'
import type { SubmissionStatus } from '../governanceTypes'
import { SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_COLORS } from '../governanceTypes'

interface Props {
  status: SubmissionStatus
  className?: string
}

/**
 * Badge component for Submission Status.
 * Safe to render for all roles — does NOT show system verification or physical verification.
 */
export function SubmissionStatusBadge({ status, className = '' }: Props) {
  const label = SUBMISSION_STATUS_LABELS[status] ?? status
  const color = SUBMISSION_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${className}`}
      aria-label={`Submission status: ${label}`}
    >
      {label}
    </span>
  )
}
