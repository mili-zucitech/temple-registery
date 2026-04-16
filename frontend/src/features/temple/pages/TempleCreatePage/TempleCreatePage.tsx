import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  Building2, MapPin, Phone, ShieldCheck, Check, ChevronRight, ChevronLeft, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTempleSchema, type CreateTempleRequest, TEMPLE_GRADES, RELIGIOUS_TRADITIONS } from '../../templeTypes'
import { useCreateTempleMutation } from '../../templeApi'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import type { GeoSelection } from '@/features/geo/geoTypes'
import { GeoHierarchySelect } from '@/features/geo/components/GeoHierarchySelect/GeoHierarchySelect'

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 0,
    title: 'Temple Identity',
    description: 'Name, grade & tradition',
    icon: Building2,
    fields: ['name', 'grade', 'tradition'] as (keyof CreateTempleRequest)[],
  },
  {
    id: 1,
    title: 'Location',
    description: 'State, district & address',
    icon: MapPin,
    fields: ['districtId', 'city', 'pinCode'] as (keyof CreateTempleRequest)[],
  },
  {
    id: 2,
    title: 'Contact Details',
    description: 'Person, phone & email',
    icon: Phone,
    fields: ['contactName', 'contactMobile', 'contactEmail'] as (keyof CreateTempleRequest)[],
  },
  {
    id: 3,
    title: 'Trust & Review',
    description: 'Trust status & submit',
    icon: ShieldCheck,
    fields: ['trustRegistered'] as (keyof CreateTempleRequest)[],
  },
] as const

// ── Component ─────────────────────────────────────────────────────────────────

export function TempleCreatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [geoSelection, setGeoSelection] = useState<GeoSelection>({})
  const [createTemple, { isLoading }] = useCreateTempleMutation()

  const form = useForm<CreateTempleRequest>({
    resolver: zodResolver(createTempleSchema),
    defaultValues: {
      name: '',
      registrationNumber: '',
      grade: undefined,
      primaryDeity: '',
      tradition: undefined,
      districtId: undefined,
      talukId: undefined,
      hobliId: undefined,
      addressLine1: '',
      addressLine2: '',
      city: '',
      pinCode: '',
      latitude: undefined,
      longitude: undefined,
      contactName: '',
      contactDesignation: '',
      contactMobile: '',
      contactEmail: '',
      languagesOfWorship: '',
      trustRegistered: false,
    },
    mode: 'onTouched',
  })

  const values = form.watch()

  const goNext = async () => {
    const fieldsToValidate = STEPS[step].fields
    const valid = await form.trigger(fieldsToValidate as (keyof CreateTempleRequest)[])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const onSubmit = async (data: CreateTempleRequest) => {
    try {
      const payload: CreateTempleRequest = {
        ...data,
        districtId: geoSelection.districtId ?? data.districtId,
        talukId: geoSelection.talukId,
        hobliId: geoSelection.hobliId,
      }
      await createTemple(payload).unwrap()
      toast.success('Temple registered successfully')
      navigate(-1)
    } catch {
      toast.error('Failed to register temple. Please try again.')
    }
  }

  const isLastStep = step === STEPS.length - 1

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] max-h-[800px] min-h-[560px] overflow-hidden rounded-2xl border border-border shadow-soft-lg">

      {/* ── Left Panel — Steps ─────────────────────────────────────────────── */}
      <aside className="relative flex w-72 flex-shrink-0 flex-col bg-gradient-dark px-6 py-8 overflow-hidden">
        {/* Decorative orb */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-temple-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-temple-saffron/10 blur-2xl" />

        {/* Header */}
        <div className="mb-8 relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-5 rounded-sm bg-gradient-gold flex items-center justify-center">
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-temple-gold">Temple Registry</span>
          </div>
          <h2 className="text-lg font-display font-semibold text-white leading-tight">Register New Temple</h2>
          <p className="mt-1 text-xs text-sidebar-foreground/60">Complete all steps to submit</p>
        </div>

        {/* Step list */}
        <nav className="flex flex-col gap-0 relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon
            const isCompleted = idx < step
            const isActive = idx === step
            const isUpcoming = idx > step

            return (
              <div key={s.id} className="flex gap-3">
                {/* Left spine */}
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <button
                    type="button"
                    onClick={() => idx < step && setStep(idx)}
                    disabled={isUpcoming}
                    className={cn(
                      'relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                      isCompleted && 'border-temple-gold bg-temple-gold cursor-pointer hover:scale-105',
                      isActive && 'border-temple-gold bg-temple-gold/15 shadow-[0_0_0_4px_hsl(36_80%_50%/0.15)]',
                      isUpcoming && 'border-sidebar-border bg-sidebar-accent/30 cursor-default',
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 text-white font-bold" strokeWidth={3} />
                    ) : (
                      <Icon className={cn('h-4 w-4', isActive ? 'text-temple-gold' : 'text-sidebar-foreground/40')} />
                    )}
                  </button>

                  {/* Connector line */}
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      'w-px flex-1 my-1 min-h-[2rem] transition-colors duration-500',
                      isCompleted ? 'bg-temple-gold/60' : 'bg-sidebar-border/50'
                    )} />
                  )}
                </div>

                {/* Text */}
                <div className={cn('pb-6 pt-1', idx === STEPS.length - 1 && 'pb-0')}>
                  <p className={cn(
                    'text-sm font-medium leading-none transition-colors duration-200',
                    isActive && 'text-white',
                    isCompleted && 'text-sidebar-foreground/70',
                    isUpcoming && 'text-sidebar-foreground/35',
                  )}>
                    {s.title}
                  </p>
                  <p className={cn(
                    'mt-1 text-xs leading-tight transition-colors duration-200',
                    isActive && 'text-temple-gold/80',
                    (isCompleted || isUpcoming) && 'text-sidebar-foreground/35',
                  )}>
                    {s.description}
                  </p>
                </div>
              </div>
            )
          })}
        </nav>

        {/* Progress bar */}
        <div className="mt-auto pt-6 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-sidebar-foreground/50">Progress</span>
            <span className="text-xs font-semibold text-temple-gold">{Math.round(((step) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-sidebar-border/50">
            <div
              className="h-full rounded-full bg-gradient-gold transition-all duration-500 ease-out"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-sidebar-foreground/40">Step {step + 1} of {STEPS.length}</p>
        </div>
      </aside>

      {/* ── Right Panel — Form ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-card">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border px-8 py-4">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">{STEPS[step].title}</h3>
            <p className="text-xs text-muted-foreground">{STEPS[step].description}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx === step ? 'w-6 bg-temple-gold' : idx < step ? 'w-3 bg-temple-gold/40' : 'w-3 bg-muted',
                )}
              />
            ))}
          </div>
        </div>

        {/* Form body */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 py-6">

              {/* Step 0 — Temple Identity */}
              {step === 0 && (
                <div className="flex flex-col gap-5 max-w-lg">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temple Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Sri Venkateswara Temple" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger className="h-10"><SelectValue placeholder="Select grade" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TEMPLE_GRADES.map((g) => (
                                <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tradition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tradition <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl>
                              <SelectTrigger className="h-10"><SelectValue placeholder="Select tradition" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RELIGIOUS_TRADITIONS.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t.charAt(0) + t.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 1 — Location */}
              {step === 1 && (
                <div className="flex flex-col gap-5 max-w-2xl">
                  <GeoHierarchySelect
                    value={geoSelection}
                    onChange={(sel) => {
                      setGeoSelection(sel)
                      if (sel.districtId) form.setValue('districtId', sel.districtId)
                    }}
                  />
                  {form.formState.errors.districtId && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.districtId.message}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City / Village</FormLabel>
                          <FormControl><Input placeholder="City or Village" className="h-10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pinCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN Code</FormLabel>
                          <FormControl><Input placeholder="560001" maxLength={6} className="h-10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl><Input placeholder="Street, landmark…" className="h-10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl><Input placeholder="Area / locality" className="h-10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2 — Contact Details */}
              {step === 2 && (
                <div className="flex flex-col gap-5 max-w-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl><Input placeholder="Full name" className="h-10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="contactMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl><Input placeholder="+91XXXXXXXXXX" className="h-10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="temple@example.com" className="h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3 — Trust & Review */}
              {step === 3 && (
                <div className="flex flex-col gap-6 max-w-lg">
                  {/* Trust toggle */}
                  <FormField
                    control={form.control}
                    name="trustRegistered"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-5">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                          <FormLabel className="text-sm font-semibold cursor-pointer">Trust Formally Registered</FormLabel>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Does this temple have a formally registered trust deed?
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Summary */}
                  <div className="rounded-xl border border-border bg-temple-warm/60 p-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Registration Summary</p>
                    <SummaryRow label="Temple Name" value={values.name} />
                    <SummaryRow label="Grade" value={values.grade ? `Grade ${values.grade}` : undefined} />
                    <SummaryRow
                      label="Tradition"
                      value={values.tradition
                        ? values.tradition.charAt(0) + values.tradition.slice(1).toLowerCase()
                        : undefined}
                    />
                    <SummaryRow label="City" value={values.city} />
                    <SummaryRow label="PIN Code" value={values.pinCode} />
                    <SummaryRow label="Contact" value={values.contactName} />
                    <SummaryRow label="Phone" value={values.contactMobile} />
                    <SummaryRow label="Email" value={values.contactEmail} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer — navigation */}
            <div className="flex items-center justify-between border-t border-border bg-card px-8 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={step === 0 ? () => navigate(-1) : goBack}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>

              {isLastStep ? (
                <Button
                  type="submit"
                  className="gap-1.5 bg-gradient-gold shadow-gold px-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Registering…</>
                  ) : (
                    <><Check className="h-4 w-4" /> Register Temple</>
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={goNext} className="gap-1.5 px-6">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

// ── Summary row helper ─────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value?: string | boolean }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground truncate text-right">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
      </span>
    </div>
  )
}
