import { useNavigate } from 'react-router-dom'
import { ArrowLeft, SendHorizontal, FileText } from 'lucide-react'
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

  const source = stagingProfile ?? currentProfile
  const location = safeJoinLocation([
    temple.villageTown ?? temple.city,
    hobliName,
    talukName,
    temple.pinCode,
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE_EDIT)}
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Profile Review</h1>
            <p className="text-sm text-muted-foreground">Verify all details before submitting to DC review.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTE_PATHS.TA_TEMPLE_EDIT)}
          >
            Edit Profile
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || profileStatus === 'SUBMITTED'}
            className="gap-1.5 bg-gradient-to-r from-primary to-accent text-primary-foreground"
          >
            <SendHorizontal size={14} />
            {isSubmitting ? 'Submitting...' : 'Submit for DC Review'}
          </Button>
        </div>
      </div>

      <StatusBanner status={profileStatus} reviewComment={stagingProfile?.reviewComment} />

      <SectionCard title="Basic Information" icon={<FileText size={16} />}>
        <InfoRow label="Temple Name" value={temple.name} />
        <InfoRow label="Registration Number" value={temple.registrationNumber} />
        <InfoRow label="Grade" value={temple.grade} />
        <InfoRow label="Primary Deity" value={temple.primaryDeity} />
        <InfoRow label="Tradition" value={temple.tradition} />
        <InfoRow label="Description" value={source?.description} multiline />
        <InfoRow label="Historical Significance" value={source?.historicalSignificance} multiline />
      </SectionCard>

      <SectionCard title="Location">
        <InfoRow label="Street" value={temple.street} />
        <InfoRow label="Village / Town" value={temple.villageTown ?? temple.city} />
        <InfoRow label="Landmark" value={source?.landmark ?? temple.landmark} />
        <InfoRow label="Location" value={location} />
        <InfoRow label="Coordinates" value={temple.latitude != null && temple.longitude != null ? `${temple.latitude}, ${temple.longitude}` : undefined} />
      </SectionCard>

      <SectionCard title="Administration & Contact">
        <InfoRow label="Contact Person" value={source?.contactPersonName ?? temple.contactName} />
        <InfoRow label="Designation" value={source?.contactPersonDesignation ?? temple.contactDesignation} />
        <InfoRow label="Phone" value={source?.phone ?? temple.contactMobile} />
        <InfoRow label="Email" value={source?.email ?? temple.contactEmail} />
        <InfoRow label="Website" value={source?.website} />
      </SectionCard>

      <SectionCard title="Cultural & Linked Information">
        <InfoRow label="Annual Festivals" value={source?.annualFestivals} multiline />
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2">
          <span className="text-sm font-medium text-muted-foreground">Languages of Worship</span>
          <TagDisplay value={source?.languagesOfWorship ?? temple.languagesOfWorship} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2">
          <span className="text-sm font-medium text-muted-foreground">Linked Institutions</span>
          <TagDisplay value={source?.linkedInstitutions} />
        </div>
      </SectionCard>

      <SectionCard title="Banking">
        <InfoRow label="Bank Name" value={source?.bankName} />
        <InfoRow label="Bank IFSC" value={source?.bankIfsc} />
        <InfoRow label="Account (Masked)" value={source?.bankAccountMasked} />
      </SectionCard>
    </div>
  )
}
