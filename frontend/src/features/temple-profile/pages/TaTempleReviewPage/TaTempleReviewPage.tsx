import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/store'
import {
  ArrowLeft, SendHorizontal, FileText, MapPin, User,
  CreditCard, Music2, Building2, Star, Globe, Phone, Mail,
  BookOpen, Hash, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { SectionCard } from '../../components/SectionCard'
import { InfoRow } from '../../components/InfoRow'
import { TagDisplay } from '../../components/TagDisplay'
import { StatusBanner } from '../../components/StatusBanner'
import { useTempleProfile } from '../../hooks/taProfileHooks'

function safeJoinLocation(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' · ') || undefined
}

export function TaTempleReviewPage() {
  const navigate = useNavigate()
  const isViewOnly = useAppSelector((s) => s.auth.currentUser?.accessType === 'VIEW')
  const {
    temple,
    currentProfile,
    stagingProfile,
    profileStatus,
    talukName,
    hobliName,
    isLoading,
    isSubmitting,
    handleSubmit,
  } = useTempleProfile()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (!temple) {
    return (
      <EmptyState
        title="Temple profile not found"
        description="Unable to load profile data for review."
      />
    )
  }

  const source = stagingProfile
  const location = safeJoinLocation([hobliName, talukName, source?.pinCode ?? temple.pinCode])

  return (
    <div className="space-y-5">

      {/* ── Sticky top bar ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-1 rounded-xl overflow-hidden shadow-md">
        <div
          className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ background: 'linear-gradient(135deg, hsl(36 80% 46%), hsl(24 85% 52%))' }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE_EDIT)}
              className="size-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              aria-label="Back to edit"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">{temple.name}</h1>
              <p className="text-[11px] text-white/70 mt-0.5">Review before submitting to DC</p>
            </div>
          </div>
          {!isViewOnly && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE_EDIT)}
                className="text-white border border-white/30 hover:bg-white/20 h-8 text-xs gap-1.5"
              >
                Edit Profile
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || profileStatus === 'SUBMITTED'}
                className="h-8 text-xs gap-1.5 bg-white text-orange-600 font-bold hover:bg-white/90 shadow-md"
              >
                <SendHorizontal size={13} />
                {isSubmitting ? 'Submitting…' : 'Submit for DC Review'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <StatusBanner status={profileStatus} reviewComment={stagingProfile?.reviewComment} />

      {/* ── Basic Information ────────────────────────────────────────────────── */}
      <SectionCard
        title="Basic Information"
        icon={
          <div className="size-6 rounded-md bg-orange-500 flex items-center justify-center">
            <FileText size={13} className="text-white" />
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          <InfoRow label="Temple Name" value={temple.name} />
          <InfoRow label="Registration No." value={temple.registrationNumber} />
          <InfoRow label="Grade" value={(source as any)?.grade ?? temple.grade ? `Grade ${(source as any)?.grade ?? temple.grade}` : undefined} />
          <InfoRow label="Year Established" value={(source as any)?.yearEstablished ?? (temple as any)?.yearEstablished} />
          <InfoRow label="Primary Deity" value={(source as any)?.primaryDeity ?? temple.primaryDeity} />
          <InfoRow label="Tradition" value={(source as any)?.tradition ?? temple.tradition} />
          {((source as any)?.aliasName ?? (temple as any)?.aliasName) && (
            <InfoRow label="Alias Name" value={(source as any)?.aliasName ?? (temple as any)?.aliasName} />
          )}
        </div>
        {(source?.description) && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <InfoRow label="Description" value={source.description} multiline />
          </div>
        )}
        {(source?.historicalSignificance) && (
          <div className="mt-2">
            <InfoRow label="Historical Significance" value={source.historicalSignificance} multiline />
          </div>
        )}
      </SectionCard>

      {/* ── Location + Contact (side-by-side on wide screens) ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Location */}
        <SectionCard
          title="Location"
          icon={
            <div className="size-6 rounded-md bg-emerald-500 flex items-center justify-center">
              <MapPin size={13} className="text-white" />
            </div>
          }
        >
          <div className="space-y-2">
            <InfoRow label="Street" value={source?.addressLine1 ?? temple.street} />
            <InfoRow label="Landmark" value={source?.landmark ?? temple.landmark} />
            <InfoRow label="Jurisdiction" value={location} />
            {(source?.pinCode ?? temple.pinCode) && <InfoRow label="PIN Code" value={source?.pinCode ?? temple.pinCode} />}
            {(source?.latitude ?? temple.latitude) != null && (source?.longitude ?? temple.longitude) != null && (
              <InfoRow label="Coordinates" value={`${source?.latitude ?? temple.latitude}, ${source?.longitude ?? temple.longitude}`} />
            )}
          </div>
        </SectionCard>

        {/* Contact */}
        <SectionCard
          title="Administration & Contact"
          icon={
            <div className="size-6 rounded-md bg-violet-500 flex items-center justify-center">
              <User size={13} className="text-white" />
            </div>
          }
        >
          <div className="space-y-2">
            <InfoRow label="Contact Person" value={source?.contactPersonName ?? temple.contactName} />
            <InfoRow label="Designation" value={source?.contactPersonDesignation ?? temple.contactDesignation} />
            <InfoRow label="Phone" value={source?.phone ?? temple.contactMobile} />
            <InfoRow label="Email" value={source?.email ?? temple.contactEmail} />
            {(source?.website) && <InfoRow label="Website" value={source.website} />}
          </div>
        </SectionCard>
      </div>

      {/* ── Cultural & Linked ────────────────────────────────────────────────── */}
      <SectionCard
        title="Cultural & Linked Information"
        icon={
          <div className="size-6 rounded-md bg-amber-500 flex items-center justify-center">
            <Music2 size={13} className="text-white" />
          </div>
        }
      >
        <div className="space-y-4">
          {source?.annualFestivals && (
            <InfoRow label="Annual Festivals" value={source.annualFestivals} multiline />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground font-semibold shrink-0 tracking-wide">Languages of Worship</span>
            <TagDisplay value={source?.languagesOfWorship ?? temple.languagesOfWorship} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground font-semibold shrink-0 tracking-wide">Linked Institutions</span>
            <TagDisplay value={source?.linkedInstitutions} />
          </div>
        </div>
      </SectionCard>

      {/* ── Banking ─────────────────────────────────────────────────────────── */}
      <SectionCard
        title="Banking"
        icon={
          <div className="size-6 rounded-md bg-sky-500 flex items-center justify-center">
            <CreditCard size={13} className="text-white" />
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          <InfoRow label="Bank Name" value={source?.bankName} />
          <InfoRow label="Bank IFSC" value={source?.bankIfsc} />
          <InfoRow label="Account (Masked)" value={source?.bankAccountMasked} />
        </div>
      </SectionCard>

    </div>
  )
}
