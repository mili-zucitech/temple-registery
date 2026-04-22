import React from 'react'
import type { SubmissionStatus } from '../governanceTypes'

interface Props {
  submissionStatus: SubmissionStatus
  sendBackReason?: string | null
}

/**
 * Displays the DC's send-back reason prominently when a record has been sent back.
 * Only renders when submissionStatus === 'SENT_BACK' and a reason is present.
 *
 * Safe to render for Temple Authority — does NOT expose any internal data.
 */
export function SendBackReasonBanner({ submissionStatus, sendBackReason }: Props) {
  if (submissionStatus !== 'SENT_BACK' || !sendBackReason) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-yellow-300 bg-yellow-50 p-4"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-yellow-600" aria-hidden="true">
          ⚠️
        </span>
        <div>
          <p className="text-sm font-semibold text-yellow-800">
            This record has been sent back by the District Collector
          </p>
          <p className="mt-1 text-sm text-yellow-700">
            <span className="font-medium">Reason: </span>
            {sendBackReason}
          </p>
          <p className="mt-2 text-xs text-yellow-600">
            Please review the reason above, make the necessary corrections, and resubmit.
          </p>
        </div>
      </div>
    </div>
  )
}
