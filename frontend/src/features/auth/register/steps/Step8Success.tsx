import { CheckCircle2, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROUTE_PATHS } from '@/constants/routePaths'

export function Step8Success() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      {/* Success Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5">
        <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold font-display">Registration Submitted!</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your registration has been received and your account is now pending activation
          by the Super Administrator.
        </p>
      </div>

      {/* What happens next */}
      <div className="w-full rounded-lg border border-border bg-muted/40 p-4 text-left space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What happens next?
        </p>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">1</span>
            The Super Administrator will review your registration and temple details.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">2</span>
            You will receive an email notification once your account is activated.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">3</span>
            After activation, log in and complete your temple profile.
          </li>
        </ul>
      </div>

      {/* Pending notice */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0" />
        <span>Typical activation time: 1–2 business days.</span>
      </div>

      <Button asChild className="w-full max-w-xs">
        <Link to={ROUTE_PATHS.LOGIN}>Go to Login →</Link>
      </Button>
    </div>
  )
}
