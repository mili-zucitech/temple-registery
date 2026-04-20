import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import { useGetTaluksQuery, useGetHoblisQuery } from '@/features/geo/geoApi'
import { submitTempleProfileSchema, TaProfileStagingFormValues, TaProfileStagingRequest, taProfileStagingSchema, TaProfileStatus } from '@/features/temple-profile/hooks/templeTypes'
import { useCreateOrUpdateDraftMutation, useGetActiveStagingQuery, useGetStagingHistoryQuery, useGetTempleByIdQuery, useGetTempleCurrentProfileQuery, useSubmitForReviewMutation } from '@/features/temple-profile/hooks/templeApi'


// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveProfileStatus(
  stagingStatus: string | undefined | null,
  checklistStatus: string | null | undefined,
  hasStagingProfile: boolean,
): TaProfileStatus {
  if (hasStagingProfile) {
    if (stagingStatus === 'DRAFT') return 'DRAFT'
    // Backend labels PENDING_REVIEW as SUBMITTED in response (DECISION-01)
    if (stagingStatus === 'PENDING_REVIEW' || stagingStatus === 'SUBMITTED') return 'SUBMITTED'
    if (stagingStatus === 'REJECTED') return 'REJECTED'
  }
  if (checklistStatus === 'APPROVED') return 'APPROVED'
  if (checklistStatus === 'SUBMITTED' || checklistStatus === 'PENDING_REVIEW') return 'SUBMITTED'
  return 'NOT_STARTED'
}

function normalizeTagList(value?: string | string[] | null): string {
  if (!value) return ''
  if (Array.isArray(value)) return value.join(', ')
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).join(', ')
      }
    } catch {
      return value
    }
  }
  return value
}

function normalizeTagArray(value?: string | string[] | null): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value.filter(Boolean)
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {
      // fall through
    }
  }
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function cleanOptional(value?: string | null): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function serializeTagList(value?: string | null): string | undefined {
  const cleaned = cleanOptional(value)
  if (!cleaned) return undefined
  const tokens = cleaned.split(',').map((s) => s.trim()).filter(Boolean)
  return tokens.length > 0 ? JSON.stringify(tokens) : undefined
}

function extractApiMessage(err: any, fallback: string): string {
  const validationMessage = err?.data?.errors?.[0]
  if (typeof validationMessage === 'string') return validationMessage
  return err?.data?.message || err?.message || fallback
}

const EMPTY_FORM: TaProfileStagingFormValues = {
  phone: '',
  email: '',
  website: '',
  contactPersonName: '',
  contactPersonDesignation: '',
  languagesOfWorship: '',
  linkedInstitutions: '',
  description: '',
  annualFestivals: '',
}

// ─── useTempleProfile ─────────────────────────────────────────────────────────

export function useTempleProfile() {
  const { data: userData, isLoading: userLoading } = useGetCurrentUserQuery()
  const user = userData?.data
  const templeId = user?.templeId

  const { data: templeData, isLoading: templeLoading, isError } = useGetTempleByIdQuery(
    templeId!, { skip: !templeId },
  )
  const temple = templeData?.data ?? null

  const { data: stagingData, isLoading: stagingLoading } = useGetActiveStagingQuery(
    templeId!, { skip: !templeId },
  )
  const stagingProfile = stagingData?.data ?? null

  const { data: currentData, isLoading: currentLoading } = useGetTempleCurrentProfileQuery(
    templeId!, { skip: !templeId },
  )
  const currentProfile = currentData?.data ?? null

  // ── Geo name resolution ────────────────────────────────────────────────────
  const { data: taluksData } = useGetTaluksQuery(
    temple?.districtId!, { skip: !temple?.districtId },
  )
  const talukName = taluksData?.data?.find(t => t.id === temple?.talukId)?.name

  const { data: hoblisData } = useGetHoblisQuery(
    temple?.talukId!, { skip: !temple?.talukId },
  )
  const hobliName = hoblisData?.data?.find(h => h.id === temple?.hobliId)?.name

  const [createOrUpdateDraft, { isLoading: isSaving }] = useCreateOrUpdateDraftMutation()
  const [submitForReview, { isLoading: isSubmitting }] = useSubmitForReviewMutation()

  const isLoading = userLoading || templeLoading || stagingLoading || currentLoading

  const profileStatus = deriveProfileStatus(
    stagingProfile?.statusLabel,
    user?.completionChecklist?.templeProfileStatus,
    stagingProfile !== null,
  )

  const isEditable = profileStatus === 'DRAFT' || profileStatus === 'REJECTED'

  const form = useForm<TaProfileStagingFormValues>({
    resolver: zodResolver(taProfileStagingSchema),
    defaultValues: EMPTY_FORM,
    mode: 'onChange',
  })

  // Prefill logic: staging (preferred) → current → registration contact → empty
  useEffect(() => {
    if (isLoading) return
    let source = stagingProfile ?? currentProfile
    if (source) {
      const parsedLinked = normalizeTagList(source.linkedInstitutions)
      const parsedLanguages = normalizeTagList(source.languagesOfWorship)

      form.reset({
        phone: source.phone ?? '',
        email: source.email ?? '',
        website: source.website ?? '',
        contactPersonName: source.contactPersonName ?? '',
        contactPersonDesignation: source.contactPersonDesignation ?? '',
        languagesOfWorship: parsedLanguages,
        linkedInstitutions: parsedLinked,
        description: source.description ?? '',
        annualFestivals: source.annualFestivals ?? '',
        landmark: (source as any).landmark ?? '',
        historicalSignificance: (source as any).historicalSignificance ?? '',
        bankName: (source as any).bankName ?? '',
        bankIfsc: (source as any).bankIfsc ?? '',
        photoFilePath: (source as any).photoFilePath ?? (source as any).photoUrl ?? '',
        bankAccountNumber: '',
      })
    } else if (temple) {
      const parsedLanguages = normalizeTagList(temple.languagesOfWorship)

      form.reset({
        phone: temple.contactMobile ?? '',
        email: temple.contactEmail ?? '',
        website: '',
        contactPersonName: temple.contactName ?? '',
        contactPersonDesignation: temple.contactDesignation ?? '',
        languagesOfWorship: parsedLanguages,
        linkedInstitutions: '',
        description: '',
        annualFestivals: '',
        landmark: temple.landmark ?? '',
        historicalSignificance: '',
        bankName: '',
        bankIfsc: '',
        photoFilePath: temple.photoUrl ?? '',
        bankAccountNumber: '',
      })
    }
    // Only run when loading transitions to complete
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = async (data: TaProfileStagingFormValues) => {
    if (!templeId) return
    try {
      // Backend expects string fields; strip empty values so optional validation
      // does not fail on empty-string payloads.
      const body: TaProfileStagingRequest = {
        phone: cleanOptional(data.phone),
        email: cleanOptional(data.email),
        website: cleanOptional(data.website),
        contactPersonName: cleanOptional(data.contactPersonName),
        contactPersonDesignation: cleanOptional(data.contactPersonDesignation),
        photoFilePath: cleanOptional(data.photoFilePath),
        bankAccountNumber: cleanOptional(data.bankAccountNumber),
        bankName: cleanOptional(data.bankName),
        bankIfsc: cleanOptional(data.bankIfsc)?.toUpperCase(),
        languagesOfWorship: serializeTagList(data.languagesOfWorship),
        linkedInstitutions: serializeTagList(data.linkedInstitutions),
        description: cleanOptional(data.description),
        annualFestivals: cleanOptional(data.annualFestivals),
        landmark: cleanOptional(data.landmark),
        historicalSignificance: cleanOptional(data.historicalSignificance),
      }

      await createOrUpdateDraft({ templeId, body }).unwrap()
      form.reset(data)
      toast.success('Draft saved successfully.')
    } catch (err: any) {
      const message = extractApiMessage(err, 'Failed to save draft. Please try again.')
      toast.error(message)
    }
  }

  const handleSubmit = async () => {
    if (!templeId) return

    if (form.formState.isDirty) {
      toast.warning('Please save the draft before submitting.')
      return
    }

    const result = submitTempleProfileSchema.safeParse(form.getValues())
    if (!result.success) {
      const message = result.error.errors[0]?.message ?? 'Please fill in all required fields.'
      toast.error(message)
      return
    }

    try {
      await submitForReview(templeId).unwrap()
      toast.success('Profile submitted for DC review.')
    } catch (err: any) {
      const message = extractApiMessage(err, 'Failed to submit profile. Please try again.')
      toast.error(message)
    }
  }

  const handleDeleteDraft = async () => {
    // TODO: Backend does not expose DELETE /temples/{templeId}/profile/staging yet.
    // When the endpoint is added, call the mutation here and invalidate TempleStaging tag.
    toast.info('Please contact the administrator to discard this draft.')
  }

  const handleStartEdit = async () => {
    if (!templeId) return
    try {
      const prefill: TaProfileStagingRequest = {
        phone: cleanOptional(currentProfile?.phone),
        email: cleanOptional(currentProfile?.email),
        website: cleanOptional(currentProfile?.website),
        contactPersonName: cleanOptional(currentProfile?.contactPersonName),
        contactPersonDesignation: cleanOptional(currentProfile?.contactPersonDesignation),
        languagesOfWorship: serializeTagList(normalizeTagArray(currentProfile?.languagesOfWorship)?.join(', ')),
        linkedInstitutions: serializeTagList(normalizeTagArray(currentProfile?.linkedInstitutions)?.join(', ')),
        description: cleanOptional(currentProfile?.description),
        annualFestivals: cleanOptional(currentProfile?.annualFestivals),
      }
      await createOrUpdateDraft({ templeId, body: prefill }).unwrap()
      toast.success('Edit mode activated. A new draft has been created.')
    } catch (err: any) {
      toast.error(extractApiMessage(err, 'Failed to start edit. Please try again.'))
    }
  }

  return {
    profileStatus,
    temple,
    talukName,
    hobliName,
    currentProfile,
    stagingProfile,
    isLoading,
    isError,
    isIniting: false,
    isSaving,
    isSubmitting,
    isDeleting: false, // TODO: update when backend DELETE endpoint is ready
    isEditable,
    form,
    handleSave,
    handleSubmit,
    handleDeleteDraft,
    handleStartEdit,
  }
}

// ─── useProfileHistory ────────────────────────────────────────────────────────

export function useProfileHistory(enabled: boolean) {
  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  return useGetStagingHistoryQuery(
    { templeId: templeId!, page: 0, size: 20 },
    { skip: !templeId || !enabled },
  )
}