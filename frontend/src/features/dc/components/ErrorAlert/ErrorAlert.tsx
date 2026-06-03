import { AlertCircle, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ErrorAlertProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

/**
 * Inline error alert for API-level failures within a page section.
 *
 * Use for localised errors (e.g. a single API call failed) rather than
 * full-page failures — for those, use <EmptyState> or <ErrorBoundary>.
 */
export function ErrorAlert({
  title = 'Something went wrong',
  message = 'Unable to load data. Please try again.',
  onRetry,
  className,
}: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm',
        className,
      )}
    >
      <AlertCircle
        size={16}
        className="text-destructive flex-shrink-0 mt-0.5"
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-destructive">{title}</p>
        <p className="text-muted-foreground mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="flex-shrink-0 gap-1 text-destructive hover:text-destructive"
        >
          <RefreshCcw size={12} />
          Retry
        </Button>
      )}
    </div>
  )
}
