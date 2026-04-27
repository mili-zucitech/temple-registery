import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useClarificationRespondMutation } from '../../declarationApi'

interface ResponseBoxProps {
  declarationId: number
}

export function ResponseBox({ declarationId }: ResponseBoxProps) {
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [clarificationRespond, { isLoading, error }] = useClarificationRespondMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate non-empty message
    if (!message.trim()) {
      setMessageError('Response is required')
      return
    }
    setMessageError(null)

    try {
      await clarificationRespond({ id: declarationId, body: { message: message.trim() } }).unwrap()
      // On success: clear the form
      setMessage('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch {
      // Error is captured in the `error` field from useClarificationRespondMutation
      // and displayed inline below the submit button. Form is intentionally not cleared.
    }
  }

  // Extract a human-readable error string from the RTK Query error
  const mutationErrorMessage = error
    ? 'error' in error
      ? (error as { error: string }).error
      : 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data
        ? String((error.data as { message: unknown }).message)
        : 'Failed to submit response. Please try again.'
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1.5">
        <Label htmlFor="response-message">Your response</Label>
        <Textarea
          id="response-message"
          rows={4}
          maxLength={2000}
          placeholder="Type your response to the clarification request…"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (messageError && e.target.value.trim()) {
              setMessageError(null)
            }
          }}
          aria-describedby={messageError ? 'response-message-error' : undefined}
          aria-invalid={!!messageError}
        />
        {messageError && (
          <p id="response-message-error" className="text-sm text-destructive">
            {messageError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="response-document">Attach document (optional)</Label>
        <input
          id="response-document"
          ref={fileInputRef}
          type="file"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
          aria-label="Attach supporting document"
        />
      </div>

      <div className="space-y-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting…' : 'Submit Response'}
        </Button>

        {mutationErrorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {mutationErrorMessage}
          </p>
        )}
      </div>
    </form>
  )
}
