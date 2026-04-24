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
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      <StatusBanner
        status={profileStatus}
        reviewComment={profileReviewComment}
      />

      <div className="flex items-center justify-end">
        <Button
          onClick={handleEdit}
          disabled={profileStatus === 'SUBMITTED'}
          className="bg-gradient-gold shadow-gold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium"
          title={profileStatus === 'SUBMITTED' ? 'Editing locked while under DC review' : undefined}
        >
          <span className="mr-2">✎</span>
          {editLabel}
        </Button>
      </div>

      {/* About Temple Section */}
      <div className="rounded-lg border border-border/60 bg-gradient-to-br from-card via-card/95 to-muted/20 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <Building2 size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">About Temple</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Info */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoField label="Temple Name" value={temple?.name} />
                <InfoField label="Registration No." value={temple?.registrationNumber} />
                <InfoField label="Primary Deity" value={temple?.primaryDeity} />
                <InfoField label="Tradition" value={temple?.tradition} />
                {temple?.yearEstablished && (
                  <InfoField label="Year Established" value={temple.yearEstablished} />
                )}
              </div>
              
              {((effective as any)?.description ?? temple?.history) && (
                <div className="pt-2 border-t border-border/50">
                  <InfoField label="Description" value={(effective as any)?.description ?? temple?.history} multiline />
                </div>
              )}
              
              {effective?.historicalSignificance && (
                <div className="pt-2 border-t border-border/50">
                  <InfoField label="Historical Significance" value={effective.historicalSignificance} multiline />
                </div>
              )}
            </div>

            {/* Profile Photo */}
            <div className="w-full lg:w-72 shrink-0">
              <div className="relative overflow-hidden rounded-lg border-2 border-border/50 bg-muted aspect-[4/3] shadow-md group sticky top-6">
                {effective?.photoUrl ? (
                  <img
                    src={`${import.meta.env.VITE_BASE_URL}${effective.photoUrl}`}
                    alt={`${temple?.name ?? 'Temple'} profile`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <Building2 size={48} className="text-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground mt-2">No Photo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Details */}
      <div className="rounded-lg border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-card dark:from-amber-950/30 dark:via-orange-950/20 dark:to-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-100/50 via-orange-50/30 to-transparent dark:from-amber-900/20 dark:via-orange-900/10">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10">
            <BookOpen size={14} className="text-amber-700 dark:text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 tracking-tight">Cultural & Religious Details</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-100 sm:w-40 shrink-0">Languages of Worship</span>
            <div className="flex-1">
              <TagDisplay value={parsedLanguages} />
            </div>
          </div>
          
          {effective?.annualFestivals && (
            <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-100 sm:w-40 shrink-0">Annual Festivals</span>
                <p className="flex-1 text-xs text-foreground whitespace-pre-wrap leading-relaxed">{effective.annualFestivals}</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-100 sm:w-40 shrink-0">Linked Institutions</span>
            <div className="flex-1">
              <TagDisplay value={parsedLinked} emptyLabel="None listed" />
            </div>
          </div>
        </div>
      </div>

      {/* Location & Contact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Location Card */}
        <div className="rounded-lg border border-border/60 bg-gradient-to-br from-card via-card/95 to-muted/20 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <MapPin size={14} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Location & Address</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {temple?.doorNumber && <InfoField label="Door No." value={temple.doorNumber} compact />}
              {temple?.street && <InfoField label="Street" value={temple.street} compact />}
              {temple?.villageTown && <InfoField label="Village / Town" value={temple.villageTown} compact />}
              {temple?.landmark && <InfoField label="Landmark" value={temple.landmark} compact />}
              {temple?.pinCode && <InfoField label="PIN Code" value={temple.pinCode} compact />}
            </div>
            {locationParts.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <InfoField label="Full Location" value={locationParts.join(' · ')} />
              </div>
            )}
            
            {temple?.latitude != null && temple.longitude != null && (
              <div className="pt-2 border-t border-border/50">
                <div className="overflow-hidden rounded-lg border border-border/50 shadow-sm" style={{height: '180px'}}>
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
        </div>

        {/* Contact Information Card */}
        <div className="rounded-lg border border-border/60 bg-gradient-to-br from-card via-card/95 to-muted/20 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Phone size={14} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Contact Information</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-2">
              <InfoField label="Contact Person" value={effectiveAny?.contactPersonName ?? temple?.contactName} />
              <InfoField label="Designation" value={effectiveAny?.contactPersonDesignation ?? temple?.contactDesignation} />
              <InfoField label="Phone" value={effectiveAny?.phone ?? temple?.contactMobile} />
              <InfoField label="Email" value={effectiveAny?.email ?? temple?.contactEmail} />
              {effectiveAny?.website && (
                <div className="pt-2 border-t border-border/50">
                  <InfoField label="Website" value={effectiveAny.website} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      {(effectiveAny?.bankName || effectiveAny?.bankAccountMasked || effectiveAny?.bankIfsc) && (
        <div className="rounded-lg border border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-card dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-r from-blue-100/50 via-indigo-50/30 to-transparent dark:from-blue-900/20 dark:via-indigo-900/10">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10">
              <Link2 size={14} className="text-blue-700 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 tracking-tight">Bank Details (Hundi/Donation)</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoField label="Bank Name" value={effectiveAny.bankName} />
              <InfoField label="IFSC Code" value={effectiveAny.bankIfsc} />
              <InfoField label="Account Number" value={effectiveAny.bankAccountMasked} />
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      <div className="rounded-lg border border-border/60 bg-gradient-to-br from-card via-card/95 to-muted/20 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <Image size={14} className="text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Temple Photo Gallery</h3>
        </div>
        <div className="p-4">
          {temple?.id && (
            <ImageGallery
              templeId={temple.id}
              photos={photos}
              isLoading={photosLoading}
              canDelete={profileStatus !== 'SUBMITTED'}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Helper component for consistent info field styling
function InfoField({ label, value, multiline = false, compact = false }: { label: string; value?: string | number | null; multiline?: boolean; compact?: boolean }) {
  const display = value != null && value !== '' ? String(value) : '—'
  const isEmpty = display === '—'

  return (
    <div className={`rounded-lg border border-border/60 bg-gradient-to-br from-background/80 to-muted/30 shadow-sm ${compact ? 'p-2' : 'p-2.5'}`}>
      <div className={`text-[9px] font-medium uppercase tracking-wider text-muted-foreground ${compact ? 'mb-0.5' : 'mb-1'}`}>{label}</div>
      {multiline ? (
        <p className={`text-xs font-medium whitespace-pre-wrap leading-relaxed ${isEmpty ? 'text-muted-foreground/60 italic' : 'text-foreground'}`}>
          {display}
        </p>
      ) : (
        <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold truncate ${isEmpty ? 'text-muted-foreground/60 italic' : 'text-foreground'}`}>
          {display}
        </div>
      )}
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
    <div className="space-y-4">
      {/* Hero Card - Responsive and styled like dashboard */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-gold px-4 py-3.5 shadow-gold border border-border">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 pointer-events-none" />
        <div className="absolute right-20 -bottom-10 h-28 w-28 rounded-full bg-white/10 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 relative">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm">
                <Building2 size={18} className="text-white" />
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight truncate">{temple.name}</h1>
              <TempleGradeBadge grade={temple.grade} />
              
            </div>
            <p className="text-xs sm:text-sm text-white/80 mt-1.5 truncate">
              {temple.tradition}
              {temple.primaryDeity ? ` · ${temple.primaryDeity}` : ''}
            </p>
          </div>
          {temple.registrationNumber && (
            <div className="shrink-0 md:text-right">
              <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider">Registration</p>
              <p className="text-sm font-mono font-semibold text-white bg-white/20 px-3 py-1 rounded-lg mt-1">{temple.registrationNumber}</p>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="inline-flex rounded-lg border border-border/60 bg-card/95 p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            History
          </button>
        </div>

        <TabsContent value="overview" className="mt-4 animate-in fade-in-50 duration-300">
          <OverviewTab  />
        </TabsContent>

        <TabsContent value="history" className="mt-4 animate-in fade-in-50 duration-300">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}