import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Fingerprint, ShieldCheck, UserCircle, Building2,
  ClipboardList, Smartphone, KeyRound, CheckCircle2, Check,
} from 'lucide-react'
import { RegisterWizardProvider, useWizard } from './RegisterContext'
import { Step1MobileAadhaar }  from './steps/Step1MobileAadhaar'
import { Step2OtpVerify }      from './steps/Step2OtpVerify'
import { Step3AccountSetup }   from './steps/Step3AccountSetup'
import { Step4TempleDetails }  from './steps/Step4TempleDetails'
import { Step5Review }         from './steps/Step5Review'
import { Step6MfaSetup }       from './steps/Step6MfaSetup'
import { Step7RecoveryCodes }  from './steps/Step7RecoveryCodes'
import { Step8Success }        from './steps/Step8Success'
import { ROUTE_PATHS } from '@/constants/routePaths'

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Identity',   desc: 'Mobile & Aadhaar',       icon: Fingerprint   },
  { id: 2, label: 'OTP Verify', desc: 'Verify Aadhaar OTP',     icon: ShieldCheck   },
  { id: 3, label: 'Account',    desc: 'Username & password',    icon: UserCircle    },
  { id: 4, label: 'Temple',     desc: 'Temple details',         icon: Building2     },
  { id: 5, label: 'Review',     desc: 'Confirm registration',   icon: ClipboardList },
  { id: 6, label: 'MFA Setup',  desc: 'Enable 2-factor auth',   icon: Smartphone    },
  { id: 7, label: 'Recovery',   desc: 'Backup recovery codes',  icon: KeyRound      },
  { id: 8, label: 'Done',       desc: 'Registration complete',  icon: CheckCircle2  },
] as const

// ── Step Router ───────────────────────────────────────────────────────────────

function StepRouter() {
  const { state } = useWizard()
  switch (state.currentStep) {
    case 1:  return <Step1MobileAadhaar />
    case 2:  return <Step2OtpVerify />
    case 3:  return <Step3AccountSetup />
    case 4:  return <Step4TempleDetails />
    case 5:  return <Step5Review />
    case 6:  return <Step6MfaSetup />
    case 7:  return <Step7RecoveryCodes />
    case 8:  return <Step8Success />
    default: return <Step1MobileAadhaar />
  }
}

// ── Mobile sticky header ( hidden on lg+ ) ────────────────────────────────────

function MobileHeader({ cur }: { cur: number }) {
  const step = STEPS.find(s => s.id === cur)!

  return (
    <header className="lg:hidden sticky top-0 z-10 bg-gradient-dark shadow-soft-md">
      <div className="px-4 pt-4 pb-3">
        {/* Brand + counter */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-gold flex items-center justify-center flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-temple-gold">
              Temple Registry
            </span>
          </div>
          <span className="text-xs tabular-nums font-medium text-sidebar-foreground/50">
            {cur} <span className="text-sidebar-foreground/25">/ 8</span>
          </span>
        </div>

        {/* Segment bar */}
        <div className="flex gap-0.5 mb-3">
          {STEPS.map(s => (
            <div
              key={s.id}
              className={cn(
                'flex-1 h-[3px] rounded-full transition-all duration-400',
                s.id < cur  ? 'bg-temple-gold'      : '',
                s.id === cur ? 'bg-temple-gold/65'   : '',
                s.id > cur  ? 'bg-sidebar-border/30' : '',
              )}
            />
          ))}
        </div>

        {/* Step label */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-temple-gold/40 bg-temple-gold/10">
            <step.icon className="h-3 w-3 text-temple-gold" />
          </div>
          <p className="text-sm font-semibold text-white leading-none">{step.label}</p>
          <span className="text-[11px] text-sidebar-foreground/45">— {step.desc}</span>
        </div>
      </div>
    </header>
  )
}

// ── Desktop sidebar ( hidden below lg ) ───────────────────────────────────────

function DesktopSidebar({ cur }: { cur: number }) {
  return (
    <aside className="hidden lg:flex lg:w-72 xl:w-80 flex-shrink-0 flex-col bg-gradient-dark px-6 pb-7 overflow-hidden relative">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-temple-gold/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-temple-saffron/8 blur-3xl" />

      {/* Brand */}
      <div className="relative flex-shrink-0">
        <div className="flex items-center gap-3 h-[72px]">
          <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold flex-shrink-0">
            <Building2 className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-temple-gold leading-none">
              Temple Registry
            </p>
            <p className="text-[10px] text-sidebar-foreground/35 mt-0.5">Govt. of Karnataka</p>
          </div>
        </div>
        <div className="h-px bg-sidebar-border/30 mb-5" />
      </div>

      {/* Step list */}
      <nav className="relative flex-1 flex flex-col min-h-0">
        {STEPS.map((s, idx) => {
          const Icon = s.icon
          const done    = cur > s.id
          const active  = cur === s.id
          const upcoming = cur < s.id

          return (
            <div key={s.id} className="flex gap-3 flex-1 min-h-0">
              {/* Spine */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                  done     && 'border-temple-gold bg-temple-gold',
                  active   && 'border-temple-gold bg-temple-dark shadow-[0_0_0_4px_hsl(36_80%_50%/0.18)]',
                  upcoming && 'border-sidebar-border/50 bg-sidebar-accent/15',
                )}>
                  {done ? (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  ) : (
                    <Icon className={cn('h-3.5 w-3.5', active ? 'text-temple-gold' : 'text-sidebar-foreground/50')} />
                  )}
                  {active && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-temple-gold border-2 border-temple-dark" />
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    'w-px flex-1 my-1 transition-colors duration-500',
                    done ? 'bg-temple-gold/45' : 'bg-sidebar-border/30',
                  )} />
                )}
              </div>

              {/* Label */}
              <div className="pt-1">
                <p className={cn(
                  'text-[13px] font-medium leading-none transition-colors',
                  active   && 'text-white',
                  done     && 'text-sidebar-foreground/70',
                  upcoming && 'text-sidebar-foreground/50',
                )}>
                  {s.label}
                </p>
                <p className={cn(
                  'mt-1 text-[11px] leading-none transition-colors',
                  active   && 'text-temple-gold/70',
                  done     && 'text-sidebar-foreground/45',
                  upcoming && 'text-sidebar-foreground/40',
                )}>
                  {s.desc}
                </p>
              </div>
            </div>
          )
        })}
      </nav>

      {/* Progress */}
      {/* no progress here — moved to right panel */}
    </aside>
  )
}

// ── Desktop right top bar ─────────────────────────────────────────────────────

function DesktopTopBar({ cur }: { cur: number }) {
  const step = STEPS.find(s => s.id === cur)!
  const Icon = step.icon
  const pct  = Math.round(((cur - 1) / STEPS.length) * 100)

  // SVG ring config
  const r    = 18
  const circ = 2 * Math.PI * r          // ≈ 113.1
  const dash = circ * (1 - pct / 100)   // offset shrinks as pct grows

  return (
    <div className="hidden lg:flex items-center gap-5 border-b border-border flex-shrink-0 bg-card px-8 h-[72px]">

      {/* Step icon + label */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/8 border border-primary/12">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold text-foreground leading-none truncate">
            {step.label}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground truncate">{step.desc}</p>
        </div>
      </div>

      {/* 8 step chips */}
      <div className="hidden xl:flex items-center gap-1">
        {STEPS.map(s => (
          <div
            key={s.id}
            title={s.label}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              s.id < cur  ? 'w-5 bg-temple-gold'        : '',
              s.id === cur ? 'w-7 bg-temple-gold/80'    : '',
              s.id > cur  ? 'w-3 bg-muted-foreground/20' : '',
            )}
          />
        ))}
      </div>

      {/* Circular ring progress */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-muted-foreground leading-none">Overall progress</span>
          <span className="text-xs text-muted-foreground mt-0.5 tabular-nums">Step {cur} of {STEPS.length}</span>
        </div>
        <div className="relative flex-shrink-0">
          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
            {/* Track */}
            <circle
              cx="24" cy="24" r={r}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3.5"
            />
            {/* Progress arc */}
            <circle
              cx="24" cy="24" r={r}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dash}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-bold text-foreground tabular-nums leading-none">{pct}%</span>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Login footer ──────────────────────────────────────────────────────────────

function LoginFooter({ className }: { className?: string }) {
  return (
    <div className={cn('border-t border-border bg-card px-6 py-3', className)}>
      <p className="text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link to={ROUTE_PATHS.LOGIN} className="text-primary font-semibold hover:underline">
          Sign in →
        </Link>
      </p>
    </div>
  )
}

// ── Wizard Shell ──────────────────────────────────────────────────────────────

function WizardShell() {
  const { state } = useWizard()
  const cur = state.currentStep

  return (
    <>
      {/* ─── MOBILE ( < lg ) ─────────────────────────────────────────────── */}
      <div className="lg:hidden flex flex-col min-h-screen bg-background">
        <MobileHeader cur={cur} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
            <StepRouter />
          </div>
        </main>
        {cur < 8 && <LoginFooter className="text-center" />}
      </div>

      {/* ─── DESKTOP ( lg+ ) ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-screen w-full overflow-hidden">
        <DesktopSidebar cur={cur} />

        <div className="flex flex-1 flex-col bg-card overflow-hidden min-w-0">
          <DesktopTopBar cur={cur} />

          <div className="flex-1 overflow-y-auto">
            <div className="px-8 xl:px-14 py-8 max-w-2xl">
              <StepRouter />
            </div>
          </div>

          {cur < 8 && <LoginFooter />}
        </div>
      </div>
    </>
  )
}

// ── Public Export ─────────────────────────────────────────────────────────────

export function RegisterWizard() {
  return (
    <RegisterWizardProvider>
      <WizardShell />
    </RegisterWizardProvider>
  )
}

