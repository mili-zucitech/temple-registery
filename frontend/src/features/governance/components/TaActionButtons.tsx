import React from 'react'
import type { SubmissionStatus } from '../governanceTypes'
import { canTaEdit, canTaSubmit } from '../governanceTypes'

interface Props {
  submissionStatus: SubmissionStatus
  onEdit?: () => void
  onSubmit?: () => void
  onView?: () => void
  onCreateNew?: () => void
  isSubmitting?: boolean
  isViewOnly?: boolean
  className?: string
}

/**
 * Temple Authority action buttons — strictly role-aware.
 *
 * Rules (from spec):
 * - DRAFT / SENT_BACK: Show "Edit & Resubmit" (or separate Edit + Submit)
 * - SUBMITTED / APPROVED: Show "View" only
 * - REJECTED: Show "Create New" only
 *
 * NEVER shows system verification, physical verification, or history.
 */
export function TaActionButtons({
  submissionStatus,
  onEdit,
  onSubmit,
  onView,
  onCreateNew,
  isSubmitting = false,
  isViewOnly = false,
  className = '',
}: Props) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="group" aria-label="Record actions">
      {/* REJECTED: TA must create a new record */}
      {!isViewOnly && submissionStatus === 'REJECTED' && (
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Create a new record (this one was rejected)"
        >
          Create New
        </button>
      )}

      {/* SENT_BACK: TA can edit and resubmit */}
      {!isViewOnly && submissionStatus === 'SENT_BACK' && (
        <>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              aria-label="Edit this record to address the send-back reason"
            >
              Edit & Resubmit
            </button>
          )}
        </>
      )}

      {/* DRAFT: TA can edit and submit */}
      {!isViewOnly && submissionStatus === 'DRAFT' && (
        <>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Edit this draft record"
            >
              Edit
            </button>
          )}
          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Submit this record for DC approval"
            >
              {isSubmitting ? 'Submitting…' : 'Submit for Approval'}
            </button>
          )}
        </>
      )}

      {/* SUBMITTED / APPROVED: View only */}
      {(submissionStatus === 'SUBMITTED' || submissionStatus === 'APPROVED') && (
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="View this record (read-only)"
        >
          View
        </button>
      )}
    </div>
  )
}
