// ── Confirm submit dialog ───────────────────────────────────────────────────────

import { Button } from "@/components/ui/button"

interface ConfirmSubmitProps {
  onConfirm: () => void
  onCancel: () => void
  isSubmitting: boolean
}

export function ConfirmSubmitOverlay({ onConfirm, onCancel, isSubmitting }: ConfirmSubmitProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <h2 className="font-semibold text-foreground">Submit for DC Review?</h2>
        <p className="text-sm text-muted-foreground">
          Once submitted, you will not be able to edit the profile until the District Collector responds.
        </p>
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Go Back
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  )
}
