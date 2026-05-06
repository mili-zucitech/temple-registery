import { EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface ReadOnlyBannerProps {
  /** Short label shown as a pill badge on the right side of the banner. */
  roleLabel?: string
  /** Optional custom message. Defaults to the standard auditor read-only message. */
  message?: string
}

/**
 * Shown on DC-owned pages that are reused in the Auditor route context.
 * Makes the read-only context unambiguous: no editing is possible from this view.
 */
export function ReadOnlyBanner({
  roleLabel = 'AUDITOR — Read Only',
  message = 'You are viewing this page in read-only mode. No data can be submitted or modified from this view.',
}: ReadOnlyBannerProps) {
  return (
    <Alert className="flex items-center justify-between border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 mb-4">
      <div className="flex items-center gap-2">
        <EyeOff size={16} className="flex-shrink-0" />
        <AlertDescription className="text-sm">{message}</AlertDescription>
      </div>
      <Badge variant="outline" className="ml-4 flex-shrink-0 border-amber-400 text-amber-700 dark:border-amber-600 dark:text-amber-300">
        {roleLabel}
      </Badge>
    </Alert>
  )
}
