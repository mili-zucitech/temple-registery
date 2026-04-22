import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Phone, MapPin, BookOpen, Star, Link2, Image } from 'lucide-react'
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

import { ROUTE_PATHS } from '@/constants/routePaths'
import { useProfileHistory, useTempleProfile } from '@/features/temple-profile/hooks/taProfileHooks'
import { useGetTemplePhotosQuery } from '../../hooks/templeApi'
import { TempleProfileStagingResponse } from '../../hooks/templeTypes'

function fmt(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab() {
  const { temple, stagingProfile, profileStatus, profileReviewComment, talukName, hobliName } = useTempleProfile()
  const navigate = useNavigate()

  const { data: photosData, isLoading: photosLoading } = useGetTemplePhotosQuery(temple?.id!, {
    skip: !temple?.id,
  })

  const photos = photosData?.data ?? []

  const effective = stagingProfile ?? temple
  const effectiveAny = effective as any


  const handleEdit = () => navigate(ROUTE_PATHS.TA_TEMPLE_EDIT)

  const editLabel =
    profileStatus === 'DRAFT' ? 'Continue Editing' :
    profileStatus === 'REJECTED' ? 'Create New Draft' : 'Edit Profile'

  const district = temple ? `District ID: ${temple.districtId}` : undefined
  const locationParts = [temple?.landmark, talukName, hobliName, district].filter(Boolean)


  let parsedLinked = effective?.linkedInstitutions
  if (typeof parsedLinked === 'string' && parsedLinked.startsWith('[')) {
    try {
      parsedLinked = JSON.parse(parsedLinked).join(', ')
    } catch {}
  }

  let parsedLanguages = effective?.languagesOfWorship
  if (typeof parsedLanguages === 'string' && parsedLanguages.startsWith('[')) {
    try {
      parsedLanguages = JSON.parse(parsedLanguages).join(', ')
    } catch {}
  }

  return (
    <div className="space-y-6">
      <StatusBanner
        status={profileStatus}
        reviewComment={profileReviewComment}
      />

      <div className="flex items-center justify-end">
        <Button
          onClick={handleEdit}
          disabled={profileStatus === 'SUBMITTED'}
          className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium"
          title={profileStatus === 'SUBMITTED' ? 'Editing locked while under DC review' : undefined}
        >
          <span className="mr-2">✎</span>
          {editLabel}
        </Button>
      </div>

      {/* About Temple Section */}
      <SectionCard title="About Temple" icon={<Building2 size={18} />}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Info */}
          <div className="flex-1 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InfoRow label="Temple Name" value={temple?.name} />
              <InfoRow label="Registration No." value={temple?.registrationNumber} />
              <InfoRow label="Primary Deity" value={temple?.primaryDeity} />
              <InfoRow label="Tradition" value={temple?.tradition} />
              {temple?.yearEstablished && (
                <InfoRow label="Year Established" value={temple.yearEstablished} />
              )}
            </div>
            
            {((effective as any)?.description ?? temple?.history) && (
              <div className="pt-3 border-t border-border/50">
                <InfoRow label="Description" value={(effective as any)?.description ?? temple?.history} multiline />
              </div>
            )}
            
            {effective?.historicalSignificance && (
              <div className="pt-3 border-t border-border/50">
                <InfoRow label="Historical Significance" value={effective.historicalSignificance} multiline />
              </div>
            )}
          </div>

          {/* Profile Photo (always show right side, fallback if missing) */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col items-center">
            <div className="relative overflow-hidden rounded-lg border-2 border-border/50 bg-muted aspect-[4/3] shadow-lg group sticky top-6 flex items-center justify-center">
              {effective?.photoUrl ? (
                <img
                  src={`${import.meta.env.VITE_BASE_URL}${effective.photoUrl}`}
                  alt={`${temple?.name ?? 'Temple'} profile`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <Building2 size={56} className="text-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground mt-2">No Photo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-xs font-medium">Primary Temple Photo</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Cultural Details */}
      <SectionCard title="Cultural & Religious Details" icon={<BookOpen size={18} />} className="bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-card dark:from-amber-950/20 dark:via-orange-950/10 dark:to-card">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-100 sm:w-48 shrink-0">Languages of Worship</span>
            <div className="flex-1">
              <TagDisplay value={parsedLanguages} />
            </div>
          </div>
          
          {effective?.annualFestivals && (
            <div className="pt-3 border-t border-amber-200/50 dark:border-amber-800/30">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-100 sm:w-48 shrink-0">Annual Festivals</span>
                <p className="flex-1 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{effective.annualFestivals}</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 pt-3 border-t border-amber-200/50 dark:border-amber-800/30">
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-100 sm:w-48 shrink-0">Linked Institutions</span>
            <div className="flex-1">
              <TagDisplay value={parsedLinked} emptyLabel="None listed" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Location & Contact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Card */}
        <SectionCard title="Location & Address" icon={<MapPin size={18} />}> 
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-y-3">
              {temple?.doorNumber && <InfoRow label="Door No." value={temple.doorNumber} />}
              {temple?.street && <InfoRow label="Street" value={temple.street} />}
              {temple?.villageTown && <InfoRow label="Village / Town" value={temple.villageTown} />}
              {temple?.landmark && <InfoRow label="Landmark" value={temple.landmark} />}
              {temple?.pinCode && <InfoRow label="PIN Code" value={temple.pinCode} />}
              {locationParts.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <InfoRow label="Full Location" value={locationParts.join(' · ')} />
                </div>
              )}
            </div>
            
            {temple?.latitude != null && temple.longitude != null && (
              <div className="pt-3 border-t border-border/50">
                <div className="overflow-hidden rounded-lg border-2 border-border/50 shadow-md" style={{height: '200px'}}>
                  <iframe
                    title="Temple Location on Google Maps"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps?q=${temple.latitude},${temple.longitude}&hl=en&z=14&output=embed`}
                  />
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Contact Information Card */}
        <SectionCard title="Contact Information" icon={<Phone size={18} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-y-3">
              <InfoRow label="Contact Person" value={effectiveAny?.contactPersonName ?? temple?.contactName} />
              <InfoRow label="Designation" value={effectiveAny?.contactPersonDesignation ?? temple?.contactDesignation} />
              <InfoRow label="Phone" value={effectiveAny?.phone ?? temple?.contactMobile} />
              <InfoRow label="Email" value={effectiveAny?.email ?? temple?.contactEmail} />
              {effectiveAny?.website && (
                <div className="pt-2 border-t border-border/50">
                  <InfoRow label="Website" value={effectiveAny.website} />
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Bank Details */}
      {(effectiveAny?.bankName || effectiveAny?.bankAccountMasked || effectiveAny?.bankIfsc) && (
        <SectionCard title="Bank Details (Hundi/Donation)" icon={<Link2 size={18} />} className="bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-card dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            <InfoRow label="Bank Name" value={effectiveAny.bankName} />
            <InfoRow label="IFSC Code" value={effectiveAny.bankIfsc} />
            <InfoRow label="Account Number" value={effectiveAny.bankAccountMasked} />
          </div>
        </SectionCard>
      )}

      {/* Photo Gallery */}
      <SectionCard title="Temple Photo Gallery" icon={<Image size={18} />}>
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
  const [activeTab, setActiveTab] = useState('overview')

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 border border-border p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <OverviewTab  />
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}