import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type {
  PhysicalVerificationStatus,
  PhysicalVerificationHistoryEntry,
  OrderPhysicalVerificationRequest,
  UpdatePhysicalVerificationRequest,
} from '../governanceTypes'
import {
  orderPhysicalVerificationSchema,
  updatePhysicalVerificationSchema,
  PHYSICAL_VERIFICATION_STATUS_LABELS,
  PHYSICAL_VERIFICATION_STATUS_COLORS,
} from '../governanceTypes'

interface Props {
  declarationId: number
  physicalVerificationStatus: PhysicalVerificationStatus
  physicalVerificationOrderedAt?: string | null
  physicalVerificationCompletedAt?: string | null
  history?: PhysicalVerificationHistoryEntry[]
  onOrder?: (request: OrderPhysicalVerificationRequest) => void
  onUpdate?: (request: UpdatePhysicalVerificationRequest) => void
  isOrdering?: boolean
  isUpdating?: boolean
}

/**
 * Physical Verification Panel — DC-ONLY component.
 *
 * STRICT RULE: This component MUST NEVER be rendered on any Temple Authority screen.
 * It shows physical verification status, history, and action buttons.
 *
 * Rules:
 * - DC can order physical verification at any time (when declaration is SUBMITTED)
 * - DC can update result: ORDERED → PHYSICALLY_VERIFIED or VERIFICATION_FAILED
 * - History is shown in this panel (DC-only)
 * - System must NEVER auto-set physical verification status
 */
export function PhysicalVerificationPanel({
  declarationId,
  physicalVerificationStatus,
  physicalVerificationOrderedAt,
  physicalVerificationCompletedAt,
  history = [],
  onOrder,
  onUpdate,
  isOrdering = false,
  isUpdating = false,
}: Props) {
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)

  const orderForm = useForm<OrderPhysicalVerificationRequest>({
    resolver: zodResolver(orderPhysicalVerificationSchema),
  })

  const updateForm = useForm<UpdatePhysicalVerificationRequest>({
    resolver: zodResolver(updatePhysicalVerificationSchema),
  })

  const statusLabel = PHYSICAL_VERIFICATION_STATUS_LABELS[physicalVerificationStatus]
  const statusColor = PHYSICAL_VERIFICATION_STATUS_COLORS[physicalVerificationStatus]

  const handleOrder = orderForm.handleSubmit((data) => {
    onOrder?.(data)
    setShowOrderForm(false)
    orderForm.reset()
  })

  const handleUpdate = updateForm.handleSubmit((data) => {
    onUpdate?.(data)
    setShowUpdateForm(false)
    updateForm.reset()
  })

  return (
    <section
      className="rounded-lg border border-gray-200 bg-white p-4 space-y-4"
      aria-label="Physical Verification (DC Only)"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Physical Verification</h3>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
          aria-label={`Physical verification status: ${statusLabel}`}
        >
          {statusLabel}
        </span>
      </div>

      {physicalVerificationOrderedAt && (
        <p className="text-xs text-gray-500">
          Ordered at: {new Date(physicalVerificationOrderedAt).toLocaleString()}
        </p>
      )}
      {physicalVerificationCompletedAt && (
        <p className="text-xs text-gray-500">
          Completed at: {new Date(physicalVerificationCompletedAt).toLocaleString()}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {physicalVerificationStatus === 'NOT_INITIATED' && (
          <button
            type="button"
            onClick={() => setShowOrderForm(true)}
            disabled={isOrdering}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            aria-label="Order physical verification for this declaration"
          >
            Order Physical Verification
          </button>
        )}

        {physicalVerificationStatus === 'ORDERED_FOR_PHYSICAL_VERIFICATION' && (
          <button
            type="button"
            onClick={() => setShowUpdateForm(true)}
            disabled={isUpdating}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            aria-label="Update physical verification result"
          >
            Update Verification Result
          </button>
        )}
      </div>

      {/* Order form */}
      {showOrderForm && (
        <form
          onSubmit={handleOrder}
          className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-3"
          aria-label="Order physical verification form"
        >
          <p className="text-sm font-medium text-blue-800">Order Physical Verification</p>
          <div>
            <label htmlFor="orderNotes" className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              id="orderNotes"
              rows={3}
              placeholder="Add any notes for the verification team…"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              {...orderForm.register('notes')}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isOrdering}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isOrdering ? 'Ordering…' : 'Confirm Order'}
            </button>
            <button
              type="button"
              onClick={() => { setShowOrderForm(false); orderForm.reset() }}
              className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Update form */}
      {showUpdateForm && (
        <form
          onSubmit={handleUpdate}
          className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 space-y-3"
          aria-label="Update physical verification result form"
        >
          <p className="text-sm font-medium text-indigo-800">Update Verification Result</p>
          <div>
            <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700">
              Result <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="newStatus"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-required="true"
              {...updateForm.register('newStatus')}
            >
              <option value="">Select result…</option>
              <option value="PHYSICALLY_VERIFIED">Physically Verified</option>
              <option value="VERIFICATION_FAILED">Verification Failed</option>
            </select>
            {updateForm.formState.errors.newStatus && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {updateForm.formState.errors.newStatus.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="updateNotes" className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              id="updateNotes"
              rows={3}
              placeholder="Add verification notes…"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...updateForm.register('notes')}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isUpdating ? 'Updating…' : 'Confirm Update'}
            </button>
            <button
              type="button"
              onClick={() => { setShowUpdateForm(false); updateForm.reset() }}
              className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* History — DC-only */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Verification History
          </h4>
          <ul className="space-y-1" aria-label="Physical verification history">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700"
              >
                <span className="font-medium">
                  {PHYSICAL_VERIFICATION_STATUS_LABELS[entry.previousStatus]} →{' '}
                  {PHYSICAL_VERIFICATION_STATUS_LABELS[entry.newStatus]}
                </span>
                {entry.notes && <span className="ml-2 text-gray-500">— {entry.notes}</span>}
                <span className="ml-2 text-gray-400">
                  {new Date(entry.occurredAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
