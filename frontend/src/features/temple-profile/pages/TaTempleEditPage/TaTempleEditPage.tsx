import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Save, SendHorizontal, FileCheck2 } from 'lucide-react'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { StatusBanner } from '../../components/StatusBanner'
import { MultipleImageUpload } from '../../components/MultipleImageUpload'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { ConfirmSubmitOverlay } from './ConfirmSubmitOverlay'
import { AccordionSection } from './AccordianSection'
import { TagInputField } from './TagInputField'
import { useTempleProfile } from '@/features/temple-profile/hooks/taProfileHooks'
import { submitTempleProfileSchema, taProfileStagingSchema, type TaProfileStagingFormValues, TEMPLE_GRADES, RELIGIOUS_TRADITIONS } from '../../hooks/templeTypes'
import { GeoHierarchySelectGrid } from '@/features/geo/components/GeoHierarchySelect/GeoHierarchySelectGrid'
import type { GeoSelection } from '@/features/geo/geoTypes'
import { TempleLocationPicker } from '../../components/TempleLocationPicker/TempleLocationPicker'

const TRADITION_LABELS: Record<string, string> = {
  SHAIVITE: 'Shaivite',
  VAISHNAVITE: 'Vaishnavite',
  SHAKTA: 'Shakta',
  JAIN: 'Jain',
  BUDDHIST: 'Buddhist',
  OTHER: 'Other',
}





// ── Main Edit Page ─────────────────────────────────────────────────────────────

export function TaTempleEditPage() {
  const navigate = useNavigate()
  const {
    temple,
    stagingProfile,
    profileStatus,
    isLoading,
    isSaving,
    isSubmitting,
    isEditable,
    handleSave,
    handleSubmit: hookSubmit,
  } = useTempleProfile()

  const [showConfirm, setShowConfirm] = useState(false)
  const [geoSelection, setGeoSelection] = useState<GeoSelection>({})

  const form = useForm<TaProfileStagingFormValues>({
    resolver: zodResolver(taProfileStagingSchema),
    defaultValues: {
      phone: '',
      email: '',
      website: '',
      contactPersonName: '',
      contactPersonDesignation: '',
      languagesOfWorship: '',
      linkedInstitutions: '',
      description: '',
      annualFestivals: '',
      landmark: '',
      historicalSignificance: '',
      bankAccountNumber: '',
      bankName: '',
      bankIfsc: '',
      photoFilePath: '',
      // Identity fields (V93)
      aliasName: '',
      primaryDeity: '',
      grade: undefined,
      tradition: undefined,
      hobliId: undefined,
      addressLine1: '',
      pinCode: '',
      latitude: null,
      longitude: null,
      placeId: null,
      formattedAddress: null,
      yearEstablished: null,
    },
  })

  // ✅ ADD THIS HELPER AT TOP (important)
  const normalizeToCommaString = (value: unknown): string => {
    if (!value) return ''

    if (Array.isArray(value)) {
      return value.filter(Boolean).join(', ')
    }

    if (typeof value === 'string') {
      // JSON string case
      if (value.startsWith('[')) {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) {
            return parsed.filter(Boolean).join(', ')
          }
        } catch {
          return ''
        }
      }

      return value
    }

    return ''
  }

  // Redirect if profile is under review (no editing allowed)
  useEffect(() => {
    if (!isLoading && temple?.verificationStatus === 'UNDER_REVIEW') {
      navigate(ROUTE_PATHS.TA_TEMPLE, { replace: true })
    }
  }, [isLoading, temple?.verificationStatus , navigate])


  const handleGeoChange = useCallback((sel: GeoSelection) => {
    setGeoSelection(sel)
    if (sel.hobliId) {
      form.setValue('hobliId', sel.hobliId, { shouldValidate: true, shouldDirty: true })
    }
  }, [form])

  // Track whether the form has been initialized from server data so photo uploads
  // don't trigger a form.reset() via the isLoading refetch cycle.
  const isFormInitialized = useRef(false)

  // Prefill logic: staging → current → temple contact
  // Guard: only run once after initial load; photo uploads must not re-trigger this.
  useEffect(() => {
    if (form.formState.isDirty) {
      return
    }
    // Do not re-init if form is already initialized and loading is just from a refetch.
    if (isFormInitialized.current) {
      return
    }

    if (!isLoading && temple) {
      const source = stagingProfile || temple

      // Resolve phone: staging.phone takes priority; fall back to temple.contactMobile.
      // Normalize by stripping any +91 or 0 prefix so the field always holds a plain 10-digit number.
      const rawPhone =
        (source as any).phone ??
        (source as any).contactMobile ??
        ''
      const normalizedPhone = String(rawPhone ?? '').replace(/^\+91/, '').replace(/^0/, '').trim()

      form.reset({
        phone: normalizedPhone,
        email: (source as any).contactEmail ?? (source as any).email ?? '',
        website: (source as any).website ?? '',

        contactPersonName:
          (source as any).contactName ??
          (source as any).contactPersonName ??
          '',

        contactPersonDesignation:
          (source as any).contactDesignation ??
          (source as any).contactPersonDesignation ??
          '',

        languagesOfWorship: normalizeToCommaString((source as any).languagesOfWorship),
        linkedInstitutions: normalizeToCommaString((source as any).linkedInstitutions),

        description: (source as any).description ?? (source as any).history ?? '',
        annualFestivals: (source as any).annualFestivals ?? '',
        landmark: (source as any).landmark ?? '',
        historicalSignificance: (source as any).historicalSignificance ?? '',

        bankName: (source as any).bankName ?? '',
        bankIfsc: (source as any).bankIfsc ?? '',

        // ❗ IMPORTANT: DO NOT PREFILL ACCOUNT NUMBER
        bankAccountNumber: '',

        // Use staging's photoUrl first (presigned). If staging has no photo yet,
        // fall back to temple.photoUrl so the primary gallery photo is reflected.
        photoFilePath:
          (source as any).photoUrl ??
          (source as any).photoFilePath ??
          (stagingProfile ? temple?.photoUrl : undefined) ??
          '',

        // Identity fields (V93) — prefer staging, fall back to temple entity
        aliasName: (source as any).aliasName ?? temple?.aliasName ?? '',
        primaryDeity: (source as any).primaryDeity ?? temple?.primaryDeity ?? '',
        grade: (source as any).grade ?? temple?.grade ?? undefined,
        tradition: (source as any).tradition ?? temple?.tradition ?? undefined,
        hobliId: (source as any).hobliId ?? temple?.hobliId ?? undefined,
        addressLine1: (source as any).addressLine1 ?? temple?.street ?? '',
        pinCode: (source as any).pinCode ?? temple?.pinCode ?? '',
        latitude: (source as any).latitude ?? (temple?.latitude as any) ?? null,
        longitude: (source as any).longitude ?? (temple?.longitude as any) ?? null,
        yearEstablished: (source as any).yearEstablished ?? temple?.yearEstablished ?? null,
      })
      isFormInitialized.current = true
      // Also initialize the geo hierarchy selector from temple data.
      // Use functional update to preserve stateId that was auto-selected by GeoHierarchySelectGrid.
      if (temple?.districtId) {
        // Use stagingProfile.talukId first (resolved server-side from hobli), fall back to temple.talukId.
        // Always set stateId=1 (Karnataka) explicitly to avoid race with GeoHierarchySelectGrid's
        // stateId auto-select firing after the prefill, which could leave stateId undefined and
        // cause the cities/districts queries to be skipped (making dropdowns appear empty).
        const effectiveHobliId = (source as any).hobliId ?? temple.hobliId ?? undefined
        const effectiveTalukId = (source as any).talukId ?? temple.talukId ?? undefined
        const effectiveCityId = temple.cityId ?? undefined
        setGeoSelection({
          stateId: 1,
          cityId: effectiveCityId,
          districtId: temple.districtId ?? undefined,
          talukId: effectiveTalukId,
          hobliId: effectiveHobliId,
        })
      }
    }
  }, [isLoading, temple, stagingProfile, form, form.formState.isDirty])

  const onSaveDraft = async (data: TaProfileStagingFormValues) => {
    await handleSave(data)
    // Reset this page's own form instance so isDirty becomes false and the
    // Submit button re-enables without requiring a manual page refresh.
    form.reset(data)
  }

  const onSubmitClick = () => {
    const result = submitTempleProfileSchema.safeParse(form.getValues())
    if (!result.success) {
      const msg = result.error.errors[0]?.message ?? 'Please fill in all required fields.'
      toast.error(msg)
      return
    }
    // If dirty, save first
    if (form.formState.isDirty) {
      toast.warning('Please save your draft before submitting.')
      return
    }
    setShowConfirm(true)
  }

  const confirmSubmit = async () => {
    setShowConfirm(false)
    await hookSubmit()
    navigate(ROUTE_PATHS.TA_TEMPLE)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <>
      {showConfirm && (
        <ConfirmSubmitOverlay
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirm(false)}
          isSubmitting={isSubmitting}
        />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSaveDraft)} className="space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE)}
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">Edit Temple Profile</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {temple?.name} · Changes require DC approval before publishing
                </p>
              </div>
            </div>

            {/* Sticky action bar */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE_REVIEW)}
                disabled={form.formState.isDirty}
                title={form.formState.isDirty ? 'Save draft before opening review' : undefined}
                className="gap-1.5"
              >
                <FileCheck2 size={14} />
                Review Profile
              </Button>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={isSaving || !form.formState.isDirty}
                className="gap-1.5"
              >
                <Save size={14} />
                {isSaving ? 'Saving…' : 'Save Draft'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onSubmitClick}
                disabled={isSubmitting || form.formState.isDirty}
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm gap-1.5"
                title={form.formState.isDirty ? 'Save draft before submitting' : undefined}
              >
                <SendHorizontal size={14} />
                Submit for Review
              </Button>
            </div>
          </div>

          {/* Status if rejected */}
          {profileStatus === 'REJECTED' && stagingProfile?.reviewComment && (
            <StatusBanner status="REJECTED" reviewComment={stagingProfile.reviewComment} />
          )}

          {/* Section 0b: Location */}
          <AccordionSection title="Temple Location">
            <p className="text-sm text-muted-foreground mb-4">
              Use the map to search and pin the temple location. Latitude and longitude will auto-fill.
              You can also drag the marker or click on the map to adjust coordinates manually.
            </p>
            <div className="space-y-4">
              <GeoHierarchySelectGrid
                value={geoSelection}
                onChange={handleGeoChange}
                lockedLevels={['city', 'district']}
              />

              <TempleLocationPicker
                lat={form.watch('latitude') ?? null}
                lng={form.watch('longitude') ?? null}
                placeId={form.watch('placeId') ?? null}
                formattedAddress={form.watch('formattedAddress') ?? null}
                disabled={!isEditable}
                onChange={({ lat, lng, placeId: pid, formattedAddress: fa }) => {
                  form.setValue('latitude', lat, { shouldDirty: true })
                  form.setValue('longitude', lng, { shouldDirty: true })
                  if (pid !== undefined) form.setValue('placeId', pid, { shouldDirty: true })
                  if (fa !== undefined) form.setValue('formattedAddress', fa, { shouldDirty: true })
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="addressLine1" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Street / Address</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Temple Road, Near Bus Stand" disabled /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="pinCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="560001" inputMode="numeric" maxLength={6} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="latitude" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0000001"
                        placeholder="e.g. 12.9716"
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="longitude" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0000001"
                        placeholder="e.g. 77.5946"
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={!isEditable}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </AccordionSection>

          {/* Section 0: Temple Identity */}
          <AccordionSection title="Temple Identity">
            <p className="text-sm text-muted-foreground mb-4">
              These identity fields define the temple's basic classification. Changes require DC approval before taking effect.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="primaryDeity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Deity</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Chamundeshwari Devi" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="aliasName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias / Local Name</FormLabel>
                  <FormControl><Input {...field} placeholder="Optional alternate name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="grade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Temple Grade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TEMPLE_GRADES.map(g => (
                        <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tradition" render={({ field }) => (
                <FormItem>
                  <FormLabel>Religious Tradition</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select tradition" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RELIGIOUS_TRADITIONS.map(t => (
                        <SelectItem key={t} value={t}>{TRADITION_LABELS[t] ?? t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="yearEstablished" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Established</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 1200"
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </AccordionSection>

          {/* Section 1: About Temple */}
          <AccordionSection title="About Temple">
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Brief description of the temple, its significance and history…"
                    rows={4}
                    className="resize-y"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="historicalSignificance" render={({ field }) => (
              <FormItem>
                <FormLabel>Historical Significance</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Details about myths, legends, or history associated with the temple…"
                    rows={3}
                    className="resize-y"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="landmark" render={({ field }) => (
              <FormItem>
                <FormLabel>Landmark</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Near Central Bus Stand" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="annualFestivals" render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Festivals</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="List the major annual festivals and their approximate dates…"
                    rows={3}
                    className="resize-y"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </AccordionSection>

          {/* Section 2: Cultural Details */}
          <AccordionSection title="Cultural Details">
            <FormField
              control={form.control}
              name="languagesOfWorship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Languages of Worship</FormLabel>
                  <FormControl>
                    <TagInputField
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="e.g. Kannada, Sanskrit"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedInstitutions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Mutts / Sub-Temples / Institutions</FormLabel>
                  <FormControl>
                    <TagInputField
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="e.g. Sri Mutt, Sub-temple"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </AccordionSection>

          {/* Section 3: Contact Information */}
          <AccordionSection title="Contact Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="contactPersonName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Full name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="contactPersonDesignation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Head Priest, Manager" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (10-digit) <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="9876543210" inputMode="tel" maxLength={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="contact@temple.org" type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://temple.org" type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </AccordionSection>

          {/* New Section: Bank Details */}
          <AccordionSection title="Bank Details (Hundi/Donation)">
            <p className="text-xs text-muted-foreground mb-4">
              Enter bank details below. Account numbers are kept encrypted. If already submitted, the last 4 digits are shown in your profile overview.
              Re-entering an account number here overrides the existing one.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="bankName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. State Bank of India" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="bankIfsc" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank IFSC <span className="text-muted-foreground font-normal">(11 chars)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="SBIN0001234" maxLength={11} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Account Number"
                      type="password"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(stagingProfile as any)?.bankAccountMasked
                      ? `Current account on record: ${(stagingProfile as any).bankAccountMasked}. Leave empty if you do not want to change it.`
                      : "Leave empty if you don't wish to change the currently saved account details."}
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </AccordionSection>

          {/* Section 4: Media */}
          <AccordionSection title="Temple Media">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload photos of the temple. The first image you select will be automatically designated as the <span className="text-primary font-medium">Primary Photo</span> (displayed in search results and headers). Additional images will be added to the gallery.
              </p>

              {temple?.id && (
                <MultipleImageUpload
                  templeId={temple.id}
                  onUploadSuccess={() => {
                    // Success handling is handled inside the component via toasts
                  }}
                />
              )}
            </div>
          </AccordionSection>

          {/* Bottom sticky footer on mobile */}
          <div className="flex sm:hidden gap-3 pb-4">
            <Button
              type="submit"
              variant="outline"
              className="flex-1 gap-1.5"
              disabled={isSaving || !form.formState.isDirty}
            >
              <Save size={14} />
              {isSaving ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 gap-1.5"
              onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE_REVIEW)}
              disabled={form.formState.isDirty}
            >
              <FileCheck2 size={14} />
              Review
            </Button>
            <Button
              type="button"
              className="flex-1 gap-1.5 bg-gradient-to-r from-primary to-accent text-primary-foreground"
              onClick={onSubmitClick}
              disabled={isSubmitting || form.formState.isDirty}
            >
              <SendHorizontal size={14} />
              Submit
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}