import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Phone, Mail, Globe, MapPin, BookOpen, Star, Link2, Image } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { TempleGradeBadge } from '@/components/data-display/StatusBadge/TempleGradeBadge'
import { StatusBanner } from '../../components/StatusBanner'
import { SectionCard } from '../../components/SectionCard'
import { InfoRow } from '../../components/InfoRow'
import { TagDisplay } from '../../components/TagDisplay'
import { VersionDetailView } from '../../components/VersionDetailView'
import { ImageGallery } from '../../components/ImageGallery'
import { 
  useTempleProfile, 
  useProfileHistory,
} from '@/features/temple/taProfileHooks'
import { useGetTemplePhotosQuery } from '@/features/temple/templeApi'
import type { TempleProfileStagingResponse } from '@/features/temple/templeTypes'
import { ROUTE_PATHS } from '@/constants/routePaths'

function fmt(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab() {
  const { temple, currentProfile, stagingProfile, profileStatus, talukName, hobliName } = useTempleProfile()
  const navigate = useNavigate()

  const { data: photosData, isLoading: photosLoading } = useGetTemplePhotosQuery(temple?.id!, {
    skip: !temple?.id,
  })

  const photos = photosData?.data ?? []

  const effective = stagingProfile ?? currentProfile

  const reviewComment =
    stagingProfile?.statusLabel === 'REJECTED' ? stagingProfile.reviewComment : null

  const handleEdit = () => navigate(ROUTE_PATHS.TA_TEMPLE_EDIT)

  const editLabel =
    profileStatus === 'DRAFT' ? 'Continue Editing' :
    profileStatus === 'REJECTED' ? 'Create New Draft' : 'Edit Profile'

  const district = temple ? `District ID: ${temple.districtId}` : undefined
  const locationParts = [temple?.landmark, talukName, hobliName, district].filter(Boolean)

  const photoPath = (effective as any)?.photoFilePath || (effective as any)?.photoUrl || temple?.photoUrl
  const photoUrl = photoPath
    ? (photoPath.startsWith('http') ? photoPath : `${import.meta.env.VITE_API_BASE_URL ?? ''}/uploads/${photoPath}`)
    : null

  let parsedLinked = effective?.linkedInstitutions
  if (typeof parsedLinked === 'string' && parsedLinked.startsWith('[')) {
    try {
      parsedLinked = JSON.parse(parsedLinked).join(', ')
    } catch {}
  }

  const hasProfileData = effective && Object.values(effective).some(v => v != null && v !== '')

  return (
    <div className="space-y-5">
      <StatusBanner
        status={profileStatus}
        reviewComment={reviewComment}
      />

      <div className="flex items-center justify-end">
        <Button
          onClick={handleEdit}
          disabled={profileStatus === 'SUBMITTED'}
          className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          title={profileStatus === 'SUBMITTED' ? 'Editing locked while under DC review' : undefined}
        >
          <span className="mr-1.5">✎</span>
          {editLabel}
        </Button>
      </div>

      <SectionCard title="About Temple" icon={<Building2 size={16} />}>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <InfoRow label="Temple Name" value={temple?.name} />
            <InfoRow label="Registration No." value={temple?.registrationNumber} />
            <InfoRow label="Primary Deity" value={temple?.primaryDeity} />
            <InfoRow label="Tradition" value={temple?.tradition} />
            {temple?.yearEstablished && (
              <InfoRow label="Year Established" value={temple.yearEstablished} />
            )}
            {effective?.description && (
              <InfoRow label="Description" value={effective.description} multiline />
            )}
            {effective?.historicalSignificance && (
              <InfoRow label="Historical Significance" value={effective.historicalSignificance} multiline />
            )}
          </div>

          {photoUrl && (
            <div className="w-full lg:w-72 shrink-0">
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted aspect-[4/3] shadow-inner">
                <img
                  src={photoUrl}
                  alt={`${temple?.name ?? 'Temple'} profile`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Cultural Details" icon={<BookOpen size={16} />} className="bg-gradient-to-br from-primary/5 via-accent/5 to-card">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <span className="text-sm font-semibold text-primary sm:w-44 shrink-0">Languages of Worship</span>
            <TagDisplay value={effective?.languagesOfWorship ?? temple?.languagesOfWorship} />
          </div>
          {effective?.annualFestivals && (
            <InfoRow label="Annual Festivals" value={effective.annualFestivals} multiline />
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <span className="text-sm font-semibold text-accent sm:w-44 shrink-0">Linked Institutions</span>
            <TagDisplay value={parsedLinked} emptyLabel="None listed" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Location" icon={<MapPin size={16} />}> 
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {temple?.doorNumber && <InfoRow label="Door No." value={temple.doorNumber} />}
          {temple?.street && <InfoRow label="Street" value={temple.street} />}
          {temple?.villageTown && <InfoRow label="Village / Town" value={temple.villageTown} />}
          {temple?.landmark && <InfoRow label="Landmark" value={temple.landmark} />}
          {locationParts.length > 0 && <InfoRow label="Location" value={locationParts.join(' · ')} className="sm:col-span-2" />}
          {temple?.pinCode && <InfoRow label="PIN Code" value={temple.pinCode} />}
        </div>
        {temple?.latitude != null && temple.longitude != null && (
          <div className="mt-3 overflow-hidden rounded-lg border border-border shadow-sm max-w-full" style={{height: '180px'}}>
            <iframe
              title="Temple Location on Google Maps"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 120, maxHeight: 180 }}
              loading="lazy"
              allowFullScreen
              className="rounded-lg"
              src={`https://www.google.com/maps?q=${temple.latitude},${temple.longitude}&hl=en&z=14&output=embed`}
            />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Contact Information" icon={<Phone size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Contact Person" value={effective?.contactPersonName ?? temple?.contactName} />
          <InfoRow label="Designation" value={effective?.contactPersonDesignation ?? temple?.contactDesignation} />
          <InfoRow label="Phone" value={effective?.phone ?? temple?.contactMobile} />
          <InfoRow label="Email" value={effective?.email ?? temple?.contactEmail} />
          {effective?.website && (
            <InfoRow label="Website" value={effective.website} className="sm:col-span-2" />
          )}
        </div>
      </SectionCard>

      {(effective?.bankName || effective?.bankAccountMasked || effective?.bankIfsc) && (
        <SectionCard title="Bank Details (Hundi/Donation)" icon={<Link2 size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3">
            <InfoRow label="Bank Name" value={effective.bankName} />
            <InfoRow label="Bank IFSC" value={effective.bankIfsc} />
            <InfoRow label="Account No." value={effective.bankAccountMasked} />
          </div>
        </SectionCard>
      )}

      <SectionCard title="Temple Photo Gallery" icon={<Image size={16} />}>
        {temple?.id && (
          <ImageGallery
            templeId={temple.id}
            photos={photos}
            isLoading={photosLoading}
            canDelete={profileStatus !== 'SUBMITTED'}
          />
        )}
      </SectionCard>
    </div>
  )
}

// ── History Tab ────────────────────────────────────────────────────────────────

function HistoryTab() {
  const { data, isLoading } = useProfileHistory(true)
  const [selected, setSelected] = useState<TempleProfileStagingResponse | null>(null)
  const history = data?.data?.content ?? []

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
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
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
  const { temple, isLoading, isError } = useTempleProfile()

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
    <div className="space-y-6">
      {/* Hero Card - Responsive and styled like dashboard */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-gold px-5 py-4 shadow-gold border border-border">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 pointer-events-none" />
        <div className="absolute right-20 -bottom-10 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm">
                <Building2 size={20} className="text-white" />
              </div>
              <h1 className="font-display text-lg sm:text-2xl font-bold text-white leading-tight truncate">{temple.name}</h1>
              <TempleGradeBadge grade={temple.grade} />
              {temple.trustRegistered && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success border border-success/20 px-2.5 py-1 text-[11px] font-semibold shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Trust Registered
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-white/80 mt-2 truncate">
              {temple.tradition}
              {temple.primaryDeity ? ` · ${temple.primaryDeity}` : ''}
            </p>
          </div>
          {temple.registrationNumber && (
            <div className="shrink-0 md:text-right mt-2 md:mt-0">
              <p className="text-[11px] text-white/80 font-medium uppercase tracking-wider">Registration</p>
              <p className="text-base font-mono font-semibold text-white bg-white/20 px-3 py-1 rounded-lg mt-1">{temple.registrationNumber}</p>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/50 border border-border p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
