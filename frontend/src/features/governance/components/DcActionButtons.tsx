import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { SubmissionStatus, PhysicalVerificationStatus, SendBackRequest, RejectRequest } from '../governanceTypes'
import { sendBackSchema, rejectSchema, canDcAct, canDcApproveDeclaration } from '../governanceTypes'

interface Props {
  submissionStatus: SubmissionStatus
  /** Only relevant for declarations. DC-only field. */
  physicalVerificationStatus?: PhysicalVerificationStatus | null
  onApprove?: () => void
  onSendBack?: (request: SendBackRequest) => void
  onReject?: (request: RejectRequest) => void
  isApproving?: boolean
  isSendingBack?: boolean
  isRejecting?: boolean
  /** If true, this is a declaration — show physical verification block warning */
  isDeclaration?: boolean
  className?: string
}

/**
 * DC action buttons — Approve, Send Back, Reject.
 *
 * Rules:
 * - Only renders action buttons when submissionStatus === 'SUBMITTED'
 * - Approve is blocked if physicalVerificationStatus === 'VERIFICATION_FAILED'
 * - Send Back requires mandatory free-text reason (no dropdowns)
 * - Reject requires mandatory free-text reason
 * - DC_STAFF sees this component but buttons are disabled (enforced server-side too)
 */
export function DcActionButtons({
  submissionStatus,
  physicalVerificationStatus,
  onApprove,
  onSendBack,
  onReject,
  isApproving = false,
  isSendingBack = false,
  isRejecting = false,
  isDeclaration = false,
  className = '',
}: Props) {
  const [showSendBackForm, setShowSendBackForm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)

  const sendBackForm = useForm<SendBackRequest>({
    resolver: zodResolver(sendBackSchema),
  })

  const rejectForm = useForm<RejectRequest>({
    resolver: zodResolver(rejectSchema),
  })

  const canAct = canDcAct(submissionStatus)
  const approveBlocked =
    isDeclaration && physicalVerificationStatus === 'VERIFICATION_FAILED'
  const canApprove = isDeclaration
    ? canDcApproveDeclaration(submissionStatus, physicalVerificationStatus)
    : canAct

  if (!canAct) return null

  const handleSendBack = sendBackForm.handleSubmit((data) => {
    onSendBack?.(data)
    setShowSendBackForm(false)
    sendBackForm.reset()
  })

  const handleReject = rejectForm.handleSubmit((data) => {
    onReject?.(data)
    setShowRejectForm(false)
    rejectForm.reset()
  })

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Approve blocked warning */}
      {approveBlocked && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          <strong>Approval blocked:</strong> Physical verification has failed for this declaration.
          Resolve the verification failure before approving.
        </div>
      )}

      {/* Primary action buttons */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="DC governance actions">
        <button
          type="button"
          onClick={onApprove}
          disabled={!canApprove || isApproving}
          className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Approve this record"
          aria-disabled={!canApprove || isApproving}
        >
          {isApproving ? 'Approving…' : 'Approve'}
        </button>

        <button
          type="button"
          onClick={() => {
            setShowSendBackForm(true)
            setShowRejectForm(false)
          }}
          disabled={isSendingBack}
          className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send back this record with a reason"
        >
          Send Back
        </button>

        <button
          type="button"
          onClick={() => {
            setShowRejectForm(true)
            setShowSendBackForm(false)
          }}
          disabled={isRejecting}
          className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Reject this record (terminal action)"
        >
          Reject
        </button>
      </div>

      {/* Send Back form — free-text reason, no dropdowns */}
      {showSendBackForm && (
        <form
          onSubmit={handleSendBack}
          className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-3"
          aria-label="Send back reason form"
        >
          <p className="text-sm font-semibold text-yellow-800">
            Send Back — Provide a reason for the temple authority
          </p>
          <div>
            <label
              htmlFor="sendBackReason"
              className="block text-sm font-medium text-gray-700"
            >
              Reason <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="sendBackReason"
              rows={4}
              placeholder="Describe clearly what needs to be corrected…"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              aria-required="true"
              {...sendBackForm.register('reason')}
            />
            {sendBackForm.formState.errors.reason && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {sendBackForm.formState.errors.reason.message}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSendingBack}
              className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {isSendingBack ? 'Sending Back…' : 'Confirm Send Back'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSendBackForm(false)
                sendBackForm.reset()
              }}
              className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reject form — free-text reason, no dropdowns */}
      {showRejectForm && (
        <form
          onSubmit={handleReject}
          className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3"
          aria-label="Rejection reason form"
        >
          <p className="text-sm font-semibold text-red-800">
            Reject — This action is terminal. The temple authority must create a new submission.
          </p>
          <div>
            <label
              htmlFor="rejectReason"
              className="block text-sm font-medium text-gray-700"
            >
              Reason <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="rejectReason"
              rows={4}
              placeholder="Provide a clear reason for rejection…"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              aria-required="true"
              {...rejectForm.register('reason')}
            />
            {rejectForm.formState.errors.reason && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {rejectForm.formState.errors.reason.message}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isRejecting}
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isRejecting ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRejectForm(false)
                rejectForm.reset()
              }}
              className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
