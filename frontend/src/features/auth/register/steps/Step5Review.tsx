import { useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWizard } from '../RegisterContext'
import { useSubmitRegistration } from '../registerHooks'

interface ReviewRowProps {
  label: string
  value?: string | number | null
}

function ReviewRow({ label, value }: ReviewRowProps) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground min-w-[140px] shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground break-all">{value}</span>
    </div>
  )
}

interface ReviewSectionProps {
  title: string
  onEdit: () => void
  children: React.ReactNode
}

function ReviewSection({ title, onEdit, children }: ReviewSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold font-display">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 gap-1 text-xs text-primary"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

const GRADE_LABELS: Record<string, string> = {
  A: 'Grade A (Major Temple)',
  B: 'Grade B (Medium Temple)',
  C: 'Grade C (Small Temple)',
}

const TRADITION_LABELS: Record<string, string> = {
  SHAIVITE: 'Shaivite', VAISHNAVITE: 'Vaishnavite',
  SHAKTA: 'Shakta', JAIN: 'Jain',
  BUDDHIST: 'Buddhist', OTHER: 'Other',
}

export function Step5Review() {
  const { state, goToStep, nextStep, saveUserId } = useWizard()
  const { submitRegistration, isLoading } = useSubmitRegistration()
  const [submitted, setSubmitted] = useState(false)

  const { step1, step3, step4 } = state

  const handleConfirm = async () => {
    if (!step1 || !step3 || !step4) return
    setSubmitted(true)
    const userId = await submitRegistration(step1, step3, step4)
    if (userId !== null) {
      saveUserId(userId)
      nextStep()
    } else {
      setSubmitted(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold font-display">Review & Confirm</h2>
        <p className="text-sm text-muted-foreground">
          Please verify all details below before finalising your registration. You can edit any section.
        </p>
      </div>

      <div className="space-y-4">
        {/* Account Info */}
        <ReviewSection title="Account Information" onEdit={() => goToStep(2)}>
          <ReviewRow label="Full Name" value={step3?.fullName} />
          <ReviewRow label="Username" value={step3?.username} />
          <ReviewRow label="Email" value={step3?.email} />
          <ReviewRow label="Mobile" value={step1?.mobile} />
          <ReviewRow label="Aadhaar Number" value={step1?.aadhaarNumber?.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')} />
          <ReviewRow
            label="Password"
            value="••••••••••"
          />
        </ReviewSection>

        {/* Temple Info */}
        <ReviewSection title="Temple Information" onEdit={() => goToStep(3)}>
          <ReviewRow label="Temple Name" value={step4?.templeName} />
          {step4?.aliasName && <ReviewRow label="Alias Name" value={step4.aliasName} />}
          <ReviewRow label="Primary Deity" value={step4?.deityName} />
          <ReviewRow
            label="Grade"
            value={step4?.grade ? GRADE_LABELS[step4.grade] : undefined}
          />
          <ReviewRow
            label="Tradition"
            value={step4?.religiousTradition ? TRADITION_LABELS[step4.religiousTradition] : undefined}
          />
          <ReviewRow label="Address" value={step4?.addressLine1} />
          <ReviewRow label="PIN Code" value={step4?.pincode} />
          {step4?.gpsLatitude != null && step4?.gpsLongitude != null && (
            <ReviewRow
              label="GPS Coordinates"
              value={`${step4.gpsLatitude}, ${step4.gpsLongitude}`}
            />
          )}
        </ReviewSection>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => goToStep(3)} className="w-1/3">
          ← Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleConfirm}
          disabled={isLoading || submitted}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering…
            </>
          ) : (
            'Confirm & Register →'
          )}
        </Button>
      </div>
    </div>
  )
}
