import { useState } from 'react'
import { Loader2, Lock, PenLine, SendHorizonal, Trash2, FilePlus, MapPin, Building2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { useTempleProfile, useProfileHistory } from '@/features/temple/taProfileHooks'
import { ProfileStatusBanner } from './ProfileStatusBanner'
import { ProfileForm } from './ProfileForm'
import { ProfileHistoryPanel } from './ProfileHistoryPanel'
import { ProfileDiffView } from './ProfileDiffView'
import { ProfileOverviewPanel } from './ProfileOverviewPanel'

const TRADITION_LABELS: Record<string, string> = {
  SHAIVITE: 'Shaivite', VAISHNAVITE: 'Vaishnavite', SHAKTA: 'Shakta',
  JAIN: 'Jain', BUDDHIST: 'Buddhist', OTHER: 'Other',
}

const STATUS_CHIP: Record<string, string> = {
  APPROVED: 'bg-emerald-400 border-emerald-300/60 text-emerald-900',
  SUBMITTED: 'bg-sky-300 border-sky-200/60 text-sky-900',
  REJECTED: 'bg-rose-400 border-rose-300/60 text-rose-900',
  DRAFT: 'bg-white/15 border-white/25 text-white/80',
  NOT_STARTED: 'bg-white/10 border-white/20 text-white/60',
}

type ActiveTab = 'overview' | 'edit' | 'history' | 'compare'

export function TATempleProfilePage() {
  const {
    profileStatus, temple, talukName, hobliName,
    currentProfile, stagingProfile,
    isLoading, isError, isIniting, isSaving, isSubmitting, isDeleting,
    isEditable, form, handleSave, handleSubmit, handleDeleteDraft, handleStartEdit,
  } = useTempleProfile()

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  const { data: historyData, isLoading: historyLoading } = useProfileHistory(
    activeTab === 'history',
  )

  const canCompare =
    currentProfile != null &&
    stagingProfile != null &&
    (stagingProfile.statusLabel === 'DRAFT' || stagingProfile.statusLabel === 'PENDING_REVIEW')

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState
          title="Failed to load profile"
          description="There was a problem fetching your temple profile. Please refresh the page."
        />
      </div>
    )
  }

  if (!temple) {
    return (
      <div className="p-6">
        <EmptyState
          title="Temple not assigned"
          description="Your account is not linked to a temple. Contact the administrator."
        />
      </div>
    )
  }

  const historyItems = historyData?.data?.content ?? []
  const reviewComment = stagingProfile?.reviewComment

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-gold px-5 py-4 shadow-gold">
          {/* Decorative orbs */}
          <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/15 pointer-events-none" />
          <div className="absolute right-24 -bottom-12 h-32 w-32 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4">
            {/* Left: icon + name + meta */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Temple photo or glass icon box */}
              {temple.photoUrl ? (
                <img
                  src={temple.photoUrl}
                  alt={temple.name}
                  className="h-12 w-12 flex-shrink-0 rounded-xl object-cover ring-2 ring-white/40"
                />
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
                  <Building2 size={22} className="text-white" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="font-display text-base sm:text-lg font-bold text-white leading-tight truncate">
                    {temple.name}
                  </h1>
                  {temple.grade && (
                    <span className="inline-flex items-center rounded-full bg-amber-400 border border-amber-300/60 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 shadow-sm">
                      Grade {temple.grade}
                    </span>
                  )}
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                    STATUS_CHIP[profileStatus] ?? 'bg-white/15 border-white/25 text-white/80',
                  )}>
                    {profileStatus.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-white/70 mt-0.5 truncate">
                  {[temple.registrationNumber && `Reg. ${temple.registrationNumber}`,
                    temple.tradition && `${TRADITION_LABELS[temple.tradition] ?? temple.tradition} Tradition`,
                    (temple.villageTown ?? (temple.districtId ? `District ${temple.districtId}` : null)),
                  ].filter(Boolean).join(' · ')}
                  {(temple.villageTown || temple.districtId) && (
                    <MapPin size={10} className="inline ml-1 -mt-px" />
                  )}
                </p>
              </div>
            </div>

            {/* Right: Edit Profile ghost button */}
            {activeTab !== 'edit' && (
              <button
                onClick={() => setActiveTab('edit')}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-white/25 border border-white/30 hover:bg-white/40 transition-colors px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Pencil size={12} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Status Banner ── */}
        <ProfileStatusBanner status={profileStatus} reviewComment={reviewComment} />

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            {canCompare && <TabsTrigger value="compare">Compare</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-5">
            <ProfileOverviewPanel
              temple={temple}
              currentProfile={currentProfile}
              stagingProfile={stagingProfile}
              profileStatus={profileStatus}
              talukName={talukName}
              hobliName={hobliName}
              onEditClick={() => setActiveTab('edit')}
            />
          </TabsContent>

          {/* Edit Profile Tab */}
          <TabsContent value="edit" className="mt-5">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
              <ProfileForm
                form={form}
                disabled={!isEditable}
                onOverviewClick={() => setActiveTab('overview')}
              />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-5">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
              <ProfileHistoryPanel items={historyItems} isLoading={historyLoading} />
            </div>
          </TabsContent>

          {/* Compare Tab */}
          {canCompare && (
            <TabsContent value="compare" className="mt-5">
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                <ProfileDiffView current={currentProfile!} staging={stagingProfile!} />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* ── Sticky Action Bar ── */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/90 backdrop-blur-md border-t border-border flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Discard (DRAFT only) */}
          <div>
            {profileStatus === 'DRAFT' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/8"
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? <Loader2 size={14} className="animate-spin mr-1.5" />
                      : <Trash2 size={14} className="mr-1.5" />}
                    Discard Draft
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the current draft. The previously approved
                      profile will remain unchanged. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDeleteDraft}
                    >
                      Discard Draft
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Right: Primary CTAs */}
          <div className="flex items-center gap-2.5">
            {profileStatus === 'SUBMITTED' && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground px-3">
                <Lock size={14} />
                Under DC Review
              </div>
            )}

            {profileStatus === 'APPROVED' && (
              <Button variant="outline" size="sm" onClick={handleStartEdit} disabled={isSaving}>
                {isSaving
                  ? <Loader2 size={14} className="animate-spin mr-1.5" />
                  : <PenLine size={14} className="mr-1.5" />}
                Edit Profile
              </Button>
            )}

            {profileStatus === 'NOT_STARTED' && (
              <Button size="sm" onClick={form.handleSubmit(handleSave)} disabled={isIniting || isSaving}>
                {(isIniting || isSaving)
                  ? <Loader2 size={14} className="animate-spin mr-1.5" />
                  : <FilePlus size={14} className="mr-1.5" />}
                Create Profile
              </Button>
            )}

            {(profileStatus === 'DRAFT' || profileStatus === 'REJECTED') && (
              <>
                <Button
                  variant="outline" size="sm"
                  onClick={form.handleSubmit(handleSave)}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 size={14} className="animate-spin mr-1.5" />}
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || form.formState.isDirty}
                  title={form.formState.isDirty ? 'Save the draft first before submitting' : undefined}
                >
                  {isSubmitting
                    ? <Loader2 size={14} className="animate-spin mr-1.5" />
                    : <SendHorizonal size={14} className="mr-1.5" />}
                  Submit for Approval
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
