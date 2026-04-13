import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { WIZARD_STEPS } from '../registerTypes'

interface WizardStepperProps {
  steps: typeof WIZARD_STEPS
  currentStep: number
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <nav aria-label="Registration progress" className="w-full">
      {/* Desktop: horizontal stepper */}
      <ol className="hidden sm:flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          const isUpcoming = currentStep < step.id
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.id}
              className={cn(
                'flex items-center',
                isLast ? 'flex-none' : 'flex-1',
              )}
            >
              <div className="flex flex-col items-center gap-1">
                {/* Circle */}
                <div
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isActive && 'border-primary bg-primary/10 text-primary ring-4 ring-primary/20',
                    isUpcoming && 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] font-medium whitespace-nowrap',
                    isCompleted && 'text-primary',
                    isActive && 'text-primary',
                    isUpcoming && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last) */}
              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 mb-5 rounded-full transition-colors duration-300',
                    isCompleted ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile: compact progress bar + label */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-muted-foreground">
            {steps.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </nav>
  )
}
