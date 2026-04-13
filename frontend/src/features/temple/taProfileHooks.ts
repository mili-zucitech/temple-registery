import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import { useGetTaluksQuery, useGetHoblisQuery } from '@/features/geo/geoApi'
import {
  useGetTempleByIdQuery,
  useGetActiveStagingQuery,
  useGetTempleCurrentProfileQuery,
  useCreateOrUpdateDraftMutation,
  useSubmitForReviewMutation,
  useGetStagingHistoryQuery,
} from './templeApi'
import {
  taProfileStagingSchema,
  submitTempleProfileSchema,
  type TaProfileStagingRequest,
  type TaProfileStatus,
} from './templeTypes'

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

const EMPTY_FORM: TaProfileStagingRequest = {
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

  const form = useForm<TaProfileStagingRequest>({
    resolver: zodResolver(taProfileStagingSchema),
    defaultValues: EMPTY_FORM,
  })

  // Prefill logic: staging (preferred) → current → registration contact → empty
  useEffect(() => {
    if (isLoading) return
    let source = stagingProfile ?? currentProfile
    if (source) {
      form.reset({
        phone: source.phone ?? '',
        email: source.email ?? '',
        website: source.website ?? '',
        contactPersonName: source.contactPersonName ?? '',
        contactPersonDesignation: source.contactPersonDesignation ?? '',
        languagesOfWorship: source.languagesOfWorship ?? '',
        linkedInstitutions: source.linkedInstitutions ?? '',
        description: source.description ?? '',
        annualFestivals: source.annualFestivals ?? '',
      })
    } else if (temple) {
      // Use registration contact details if no profile exists
      form.reset({
        phone: temple.contactMobile ?? '',
        email: temple.contactEmail ?? '',
        website: '',
        contactPersonName: temple.contactName ?? '',
        contactPersonDesignation: temple.contactDesignation ?? '',
        languagesOfWorship: temple.languagesOfWorship ?? '',
        linkedInstitutions: '',
        description: '',
        annualFestivals: '',
      })
    }
    // Only run when loading transitions to complete
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = async (data: TaProfileStagingRequest) => {
    if (!templeId) return
    try {
      await createOrUpdateDraft({ templeId, body: data }).unwrap()
      form.reset(data) // reset isDirty after successful save
      toast.success('Draft saved successfully.')
    } catch {
      toast.error('Failed to save draft. Please try again.')
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
    } catch {
      toast.error('Failed to submit profile. Please try again.')
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
        phone: currentProfile?.phone ?? '',
        email: currentProfile?.email ?? '',
        website: currentProfile?.website ?? '',
        contactPersonName: currentProfile?.contactPersonName ?? '',
        contactPersonDesignation: currentProfile?.contactPersonDesignation ?? '',
        languagesOfWorship: currentProfile?.languagesOfWorship ?? '',
        linkedInstitutions: currentProfile?.linkedInstitutions ?? '',
        description: currentProfile?.description ?? '',
        annualFestivals: currentProfile?.annualFestivals ?? '',
      }
      await createOrUpdateDraft({ templeId, body: prefill }).unwrap()
      toast.success('Edit mode activated. A new draft has been created.')
    } catch {
      toast.error('Failed to start edit. Please try again.')
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
