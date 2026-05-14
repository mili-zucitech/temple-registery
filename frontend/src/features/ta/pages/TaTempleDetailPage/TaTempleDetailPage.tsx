import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Building2, MapPin, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { TempleGradeBadge } from '@/components/data-display/StatusBadge/TempleGradeBadge'
import { useAppSelector } from '@/app/store'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useTaTempleDetail } from '@/features/ta/hooks/useTaTempleDetail'
import type { TempleGrade } from '@/features/temple-profile/hooks/templeTypes'
import type { TempleSearchResultResponse } from '@/features/temple-profile/hooks/templeTypes'

export function TaTempleDetailPage() {
  const { templeId } = useParams<{ templeId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const id = Number(templeId)

  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const isOwnTemple = currentUser?.templeId === id

  const { profile, staging, isLoading, isError } = useTaTempleDetail(id, isOwnTemple)

  // For non-own temples, show data passed via navigation state (from search card)
  const navState = location.state as { templeSearchResult?: TempleSearchResultResponse } | null
  const publicData = navState?.templeSearchResult

  if (isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  // ── Non-own temple: read-only public view ──────────────────────────────────
  if (!isOwnTemple) {
    const name = publicData?.name ?? `Temple #${id}`
    const grade = publicData?.grade
    const deity = publicData?.primaryDeity
    const districtName = publicData?.districtName

    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
            <ChevronLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{name}</h1>
            <p className="text-xs text-slate-500">Read-only view — you can only edit your own temple</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-14 rounded-xl bg-amber-100 flex items-center justify-center">
              {publicData?.photoUrl ? (
                <img src={publicData.photoUrl} alt={name} className="size-14 rounded-xl object-cover" />
              ) : (
                <Building2 size={28} className="text-amber-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{name}</h2>
                {grade && <TempleGradeBadge grade={grade as TempleGrade} />}
              </div>
              {districtName && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin size={11} />{districtName}
                </p>
              )}
            </div>
          </div>

          {deity && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Star size={14} className="text-amber-500" />
              <span className="font-medium">Primary Deity:</span> {deity}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 text-sm text-slate-500 text-center">
            Detailed information for other temples is not available in the TA module.
          </div>
        </div>
      </div>
    )
  }

  // ── Own temple: full edit view ─────────────────────────────────────────────

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState
          title="Temple not found"
          description="Unable to load your temple profile."
          action={{ label: 'Go back', onClick: () => navigate(-1) }}
        />
      </div>
    )
  }

  const pendingStatusLabel = staging?.statusLabel
  const hasPendingReview = pendingStatusLabel === 'SUBMITTED' || pendingStatusLabel === 'UNDER_REVIEW'
  const isDraft = pendingStatusLabel === 'DRAFT'
  const isApproved = !staging

  const statusBadge = (() => {
    if (isDraft) return { label: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200' }
    if (hasPendingReview) return { label: 'Pending Review', color: 'bg-amber-100 text-amber-700 border-amber-200' }
    if (isApproved) return { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    return null
  })()

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
          <ChevronLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 truncate">{profile.name}</h1>
            {profile.grade && <TempleGradeBadge grade={profile.grade as TempleGrade} />}
            {statusBadge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Your Temple — full editing available</p>
        </div>
      </div>

      {/* Action card */}
      <div className="bg-white rounded-xl border border-primary/30 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl overflow-hidden bg-amber-50 flex items-center justify-center flex-shrink-0">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.name} className="size-16 object-cover" />
            ) : (
              <Building2 size={32} className="text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-base">{profile.name}</h2>
            {profile.primaryDeity && <p className="text-sm text-slate-500">Deity: {profile.primaryDeity}</p>}
            {profile.contactMobile && <p className="text-xs text-slate-400 mt-1">Contact: {profile.contactMobile}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <Button
            variant="default"
            onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE_EDIT)}
            disabled={hasPendingReview}
          >
            {isDraft ? 'Continue Editing' : hasPendingReview ? 'Under Review…' : 'Edit Profile'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE)}
          >
            View Full Profile
          </Button>
        </div>

        {hasPendingReview && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-center">
            Your profile is currently under review by the District Collector. Editing is locked until a decision is made.
          </p>
        )}
      </div>

      {/* Profile summary */}
      {profile && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><span className="text-slate-500 text-xs">Contact Person:</span><p className="font-medium text-slate-900">{profile.contactName ?? '—'}</p></div>
            <div><span className="text-slate-500 text-xs">Designation:</span><p className="font-medium text-slate-900">{profile.contactDesignation ?? '—'}</p></div>
            <div><span className="text-slate-500 text-xs">Phone:</span><p className="font-medium text-slate-900">{profile.contactMobile ?? '—'}</p></div>
            <div><span className="text-slate-500 text-xs">Email:</span><p className="font-medium text-slate-900">{profile.contactEmail ?? '—'}</p></div>
            <div><span className="text-slate-500 text-xs">Bank:</span><p className="font-medium text-slate-900">{profile.bankName ?? '—'}</p></div>
            <div><span className="text-slate-500 text-xs">IFSC:</span><p className="font-medium text-slate-900">{profile.bankIfsc ?? '—'}</p></div>
          </div>
        </div>
      )}
    </div>
  )
}
