import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/store'
import { Building2, Phone, MapPin, BookOpen, Star, Link2, Image, AlertTriangle, CheckCircle2, Clock, XCircle, FileEdit, X } from 'lucide-react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { TempleGradeBadge } from '@/components/data-display/StatusBadge/TempleGradeBadge'
import { TagDisplay } from '../../components/TagDisplay'
import { VersionDetailView } from '../../components/VersionDetailView'
import { ImageGallery } from '../../components/ImageGallery'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { useProfileHistory, useTempleProfile } from '@/features/temple-profile/hooks/taProfileHooks'
import { useGetTemplePhotosQuery } from '../../hooks/templeApi'
import { TempleProfileStagingResponse } from '../../hooks/templeTypes'
import { TimelineTab } from '@/features/dc/pages/DcTempleProfilePage/tabs/TimelineTab'
import { usePermissions } from '@/features/access-control/hooks/usePermissions'
import { TARGET_KEYS } from '@/features/access-control/constants/targetKeys'

const TA_TAB_KEYS: Record<string, string> = {
  overview: TARGET_KEYS.TAB_TA_TEMPLE_OVERVIEW,
  history:  TARGET_KEYS.TAB_TA_TEMPLE_HISTORY,
  timeline: TARGET_KEYS.TAB_TA_TEMPLE_TIMELINE,
}

function fmt(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab() {
  const { temple, stagingProfile, currentProfile, profileStatus, profileReviewComment, talukName, hobliName } = useTempleProfile()
  const navigate = useNavigate()
  const isViewOnly = useAppSelector((s) => s.auth.currentUser?.accessType === 'VIEW')
  // Local dismissal for the rejection banner. Auto-resets if status changes away from REJECTED.
  const [rejectionDismissed, setRejectionDismissed] = useState(false)

  const { data: photosData, isLoading: photosLoading } = useGetTemplePhotosQuery(temple?.id!, {
    skip: !temple?.id,
  })

  const photos = photosData?.data ?? []

  const effective = stagingProfile ?? temple
  const effectiveAny = effective as any
  const effectiveBankAccountMasked =
    effectiveAny?.bankAccountMasked ?? (currentProfile as any)?.bankAccountMasked ?? null
  // Null-safe photo fallback: staging may exist but have no photoUrl (e.g. first draft with no photo saved).
  // currentProfile is the latest approved staging version (has photoUrl). Fall through to temple.photoUrl last.
  const effectivePhotoUrl = stagingProfile?.photoUrl ?? currentProfile?.photoUrl ?? temple?.photoUrl


  const handleEdit = () => navigate(ROUTE_PATHS.TA_TEMPLE_EDIT)

  const editLabel =
    profileStatus === 'DRAFT' ? 'Continue Editing' :
      profileStatus === 'REJECTED' ? 'Create New Draft' : 'Edit Profile'

  const effectiveLandmark = (effectiveAny?.landmark ?? temple?.landmark) || null
  const effectivePrimaryDeity = effectiveAny?.primaryDeity ?? temple?.primaryDeity ?? null
  const effectiveTradition = effectiveAny?.tradition ?? temple?.tradition ?? null
  const effectiveAliasName = effectiveAny?.aliasName ?? temple?.aliasName ?? null
  const effectiveGrade = effectiveAny?.grade ?? temple?.grade ?? null
  const effectiveYearEstablished = effectiveAny?.yearEstablished ?? temple?.yearEstablished ?? null
  const effectiveAddressLine1 = effectiveAny?.addressLine1 ?? temple?.street ?? null
  const effectivePinCode = effectiveAny?.pinCode ?? temple?.pinCode ?? null
  const effectiveLatitude = effectiveAny?.latitude ?? temple?.latitude ?? null
  const effectiveLongitude = effectiveAny?.longitude ?? temple?.longitude ?? null


  let parsedLinked = effective?.linkedInstitutions
  if (typeof parsedLinked === 'string' && parsedLinked.startsWith('[')) {
    try {
      parsedLinked = JSON.parse(parsedLinked).join(', ')
    } catch { }
  }

  let parsedLanguages = effective?.languagesOfWorship
  if (typeof parsedLanguages === 'string' && parsedLanguages.startsWith('[')) {
    try {
      parsedLanguages = JSON.parse(parsedLanguages).join(', ')
    } catch { }
  }

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">

      {/* DC-flagged banner */}
      {temple?.verificationStatus === 'FLAGGED' && (
        <div className="rounded-xl border-l-4 border-destructive bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">Flagged By District Collector</p>
              <p className="text-sm text-foreground mt-0.5">
                {temple.dcRejectionReason?.trim() || 'Your profile was flagged. Please update the profile details and resubmit for review.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection banner */}
      {profileStatus === 'REJECTED' && !rejectionDismissed && (
        <div className="rounded-xl border-l-4 border-destructive bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Profile Update Rejected by DC</p>
              <p className="text-sm text-foreground mt-0.5">
                {profileReviewComment || 'Your profile update was rejected. Please review the feedback and create a new draft to resubmit.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRejectionDismissed(true)}
              className="shrink-0 rounded-md p-1 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Dismiss rejection notice"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Under review banner */}
      {(profileStatus === 'SUBMITTED' || profileStatus === 'RESUBMITTED') && (
        <div className="rounded-xl border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/30 p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Under DC Review</p>
              <p className="text-sm text-blue-800/80 dark:text-blue-200/80 mt-0.5">Your temple profile is under review by the District Collector. Editing is locked until a decision is made.</p>
            </div>
          </div>
        </div>
      )}

      {/* Draft pending submit */}
      {profileStatus === 'UPDATED_AFTER_APPROVAL' && (
        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="flex items-start gap-3">
            <FileEdit className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Profile Update Draft Ready</p>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-0.5">You have an unsaved draft with profile updates. Submit it for DC review when ready.</p>
            </div>
          </div>
        </div>
      )}

      {/* Verified banner */}
      {(profileStatus === 'APPROVED' || (profileStatus === 'NOT_STARTED' && temple?.verificationStatus === 'VERIFIED')) && (
        <div className="rounded-xl border-l-4 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Verified By District Collector</p>
              <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">Your temple profile has been verified by the District Collector.</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit action */}
      {!isViewOnly && (
        <div className="flex items-center justify-end">
          <Button
            onClick={handleEdit}
            disabled={profileStatus === 'SUBMITTED' || profileStatus === 'RESUBMITTED'}
            className="bg-gradient-gold shadow-gold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium"
            title={(profileStatus === 'SUBMITTED' || profileStatus === 'RESUBMITTED') ? 'Editing locked while under DC review' : undefined}
          >
            <span className="mr-2">✎</span>
            {editLabel}
          </Button>
        </div>
      )}

      {/* ── Temple Identity & Photo ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-sm">
            <Building2 size={14} className="text-white" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">About Temple</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Details grid */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField label="Temple Name" value={temple?.name} />
                <InfoField label="Registration No." value={temple?.registrationNumber} />
                <InfoField label="Primary Deity" value={effectivePrimaryDeity} />
                <InfoField label="Tradition" value={effectiveTradition} />
                {effectiveAliasName && (
                  <InfoField label="Alias Name" value={effectiveAliasName} />
                )}
                {effectiveGrade && (
                  <InfoField label="Grade" value={`Grade ${effectiveGrade}`} />
                )}
                {effectiveYearEstablished && (
                  <InfoField label="Year Established" value={effectiveYearEstablished} />
                )}
              </div>

              {((effective as any)?.description ?? temple?.history) && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <InfoField label="Description" value={(effective as any)?.description ?? temple?.history} multiline />
                </div>
              )}

              {effective?.historicalSignificance && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <InfoField label="Historical Significance" value={effective.historicalSignificance} multiline />
                </div>
              )}
            </div>

            {/* Profile photo */}
            <div className="w-full lg:w-56 shrink-0 flex flex-col items-center gap-2">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-orange-200/60 dark:border-orange-800/40 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 shadow-md group">
                {effectivePhotoUrl ? (
                  <img
                    src={`${import.meta.env.VITE_BASE_URL ?? ''}${effectivePhotoUrl}`}
                    alt={`${temple?.name ?? 'Temple'} profile photo`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                    <Building2 size={40} className="text-orange-300" />
                    <span className="text-xs text-slate-400 font-medium">No Photo</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Primary Photo</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cultural & Religious Details ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200/60 dark:border-amber-800/40 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-100 dark:border-amber-900/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
            <BookOpen size={14} className="text-white" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Cultural & Religious Details</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Languages of Worship</p>
            <TagDisplay value={parsedLanguages} />
          </div>

          {effective?.annualFestivals && (
            <div className="pt-3 border-t border-amber-100 dark:border-amber-900/30">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Annual Festivals</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{effective.annualFestivals}</p>
            </div>
          )}

          <div className="pt-3 border-t border-amber-100 dark:border-amber-900/30">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Linked Institutions</p>
            <TagDisplay value={parsedLinked} emptyLabel="None listed" />
          </div>
        </div>
      </div>

      {/* ── Location & Contact ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Jurisdiction */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <MapPin size={14} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Jurisdiction</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="District" value={temple?.districtName ?? '—'} />
              <InfoField label="City" value={(temple as any)?.cityName ?? '—'} />
              <InfoField label="Taluk" value={talukName ?? '—'} />
              <InfoField label="Hobli" value={hobliName ?? '—'} />
            </div>
            {(effectiveAddressLine1 || temple?.villageTown || temple?.doorNumber) && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <InfoField
                  label="Street Address"
                  value={[temple?.doorNumber, effectiveAddressLine1, temple?.villageTown].filter(Boolean).join(', ')}
                />
              </div>
            )}
            {effectiveLandmark && (
              <div>
                <InfoField label="Landmark" value={effectiveLandmark} />
              </div>
            )}
            {effectivePinCode && (
              <div>
                <InfoField label="PIN Code" value={effectivePinCode} />
              </div>
            )}
            {effectiveLatitude != null && effectiveLongitude != null && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="overflow-hidden rounded-lg border border-emerald-200/60 shadow-sm" style={{ height: 200 }}>
                  <iframe
                    title="Temple Location on Google Maps"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps?q=${effectiveLatitude},${effectiveLongitude}&hl=en&z=14&output=embed`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-purple-200/60 dark:border-purple-800/40 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-purple-100 dark:border-purple-900/40 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
              <Phone size={14} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Contact Information</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <InfoField label="Contact Person" value={effectiveAny?.contactPersonName ?? temple?.contactName} />
              <InfoField label="Designation" value={effectiveAny?.contactPersonDesignation ?? temple?.contactDesignation} />
              <InfoField label="Phone" value={effectiveAny?.phone ?? temple?.contactMobile} />
              <InfoField label="Email" value={effectiveAny?.email ?? temple?.contactEmail} />
              {effectiveAny?.website && (
                <InfoField label="Website" value={effectiveAny.website} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bank Details ── */}
      {(effectiveAny?.bankName || effectiveBankAccountMasked || effectiveAny?.bankIfsc) && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200/60 dark:border-blue-800/40 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-blue-100 dark:border-blue-900/40 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Link2 size={14} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Bank Details (Hundi / Donation)</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoField label="Bank Name" value={effectiveAny.bankName} />
              <InfoField label="IFSC Code" value={effectiveAny.bankIfsc} />
              <InfoField label="Account Number" value={effectiveBankAccountMasked} />
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Gallery ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-sm">
            <Image size={14} className="text-white" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Temple Photo Gallery</h3>
        </div>
        <div className="p-4">
          {temple?.id && (
            <ImageGallery
              templeId={temple.id}
              photos={photos}
              isLoading={photosLoading}
              canDelete={profileStatus !== 'SUBMITTED' && profileStatus !== 'RESUBMITTED'}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Info Field Helper ──────────────────────────────────────────────────────────

function InfoField({ label, value, multiline = false }: { label: string; value?: string | number | null; multiline?: boolean; compact?: boolean }) {
  const display = value != null && value !== '' ? String(value) : '—'
  const isEmpty = display === '—'

  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
      {multiline ? (
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isEmpty ? 'text-slate-400 italic' : 'text-slate-800 dark:text-slate-200'}`}>
          {display}
        </p>
      ) : (
        <p className={`text-sm font-semibold break-words ${isEmpty ? 'text-slate-400 italic font-normal' : 'text-slate-800 dark:text-slate-200'}`}>
          {display}
        </p>
      )}
    </div>
  )
}

// ── History Tab ────────────────────────────────────────────────────────────────

const HISTORY_EXCLUDED_STATUSES = ['DRAFT', 'UPDATED_AFTER_APPROVAL']

function HistoryTab() {
  const { data, isLoading } = useProfileHistory(true)
  const [selected, setSelected] = useState<TempleProfileStagingResponse | null>(null)
  // Exclude draft/in-progress rows — history shows only submitted and reviewed versions.
  const history = (data?.data?.content ?? []).filter(
    (item) => !HISTORY_EXCLUDED_STATUSES.includes(item.statusLabel ?? '')
  )
  const approvedCount = history.filter((item) => item.statusLabel === 'APPROVED').length
  const rejectedCount = history.filter((item) => item.statusLabel === 'REJECTED').length

  if (isLoading) return <CardSkeleton />

  if (history.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        description="Submitted and reviewed profile versions will appear here."
        icon={<Star size={28} />}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Total Versions</p>
          <p className="text-xl font-semibold text-foreground">{history.length}</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3">
          <p className="text-xs text-success/80">Approved</p>
          <p className="text-xl font-semibold text-success">{approvedCount}</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-xs text-destructive/80">Rejected</p>
          <p className="text-xl font-semibold text-destructive">{rejectedCount}</p>
        </div>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Version</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Submitted</th>
              <th className="px-4 py-3 text-left font-semibold">Reviewed</th>
              <th className="px-4 py-3 text-left font-semibold">DC Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setSelected(selected?.id === v.id ? null : v)}
              >
                <td className="px-4 py-3 font-medium text-foreground">v{v.versionNumber}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={v.statusLabel} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmt(v.submittedAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmt(v.reviewedAt)}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-normal break-words max-w-xs">
                  {v.reviewComment ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <VersionDetailView version={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function TaTemplePage() {
  const { temple, stagingProfile, currentProfile, isLoading, isError } = useTempleProfile()
  const [activeTab, setActiveTab] = useState('overview')
  const { can } = usePermissions()

  if (isLoading) return (
    <div className="space-y-4">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )

  if (isError || !temple) {
    return (
      <EmptyState
        title="Temple not found"
        description="Unable to load your temple details. Please try again."
        icon={<Building2 size={32} />}
      />
    )
  }

  return (
    <div className="space-y-0">
      {/* ── Hero Header ── */}
      <div
        className="relative overflow-hidden rounded-t-xl px-5 py-5 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, hsl(36 80% 50%), hsl(24 85% 55%))',
          boxShadow: '0 4px 20px hsl(36 80% 50% / 0.25)',
        }}
      >
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 pointer-events-none" />
        <div className="absolute right-20 -bottom-10 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
              <Building2 size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white leading-tight">{temple.name}</h1>
                <TempleGradeBadge grade={temple.grade} variant="on-dark" />
              </div>
              <p className="text-sm text-white/80 mt-1 leading-relaxed">
                {temple.tradition}{temple.primaryDeity ? ` · ${temple.primaryDeity}` : ''}
              </p>
            </div>
          </div>
          {temple.registrationNumber && (
            <div className="shrink-0 sm:text-right">
              <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Registration</p>
              <p className="text-sm font-mono font-semibold text-white bg-white/20 px-3 py-1 rounded-lg mt-1 border border-white/20">{temple.registrationNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="flex overflow-x-auto scrollbar-thin px-4">
          {(['overview', 'history', 'timeline'] as const).filter((tab) => can(TA_TAB_KEYS[tab])).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap',
                activeTab === tab
                  ? 'text-white after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-gradient-to-r after:from-orange-400 after:to-amber-500'
                  : 'text-slate-400 hover:text-white',
              ].join(' ')}
            >
              {tab === 'overview' ? 'Overview' : tab === 'history' ? 'History' : 'Timeline'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Contents ── */}
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {can(TARGET_KEYS.TAB_TA_TEMPLE_OVERVIEW) && (
          <TabsContent value="overview" className="mt-0 p-4 focus-visible:outline-none animate-in fade-in-50 duration-300">
            <OverviewTab />
          </TabsContent>
          )}

          {can(TARGET_KEYS.TAB_TA_TEMPLE_HISTORY) && (
          <TabsContent value="history" className="mt-0 p-4 focus-visible:outline-none animate-in fade-in-50 duration-300">
            <HistoryTab />
          </TabsContent>
          )}

          {can(TARGET_KEYS.TAB_TA_TEMPLE_TIMELINE) && (
          <TabsContent value="timeline" className="mt-0 p-4 focus-visible:outline-none animate-in fade-in-50 duration-300">
            <TimelineTab templeId={temple.id} />
          </TabsContent>
          )}

        </Tabs>
      </div>
    </div>
  )
}