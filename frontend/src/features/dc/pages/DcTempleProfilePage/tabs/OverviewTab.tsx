import { Building2, MapPin, Phone, Shield, TrendingUp, UserCircle, AlertCircle, Check, X, Clock, CheckCircle2, Flag } from 'lucide-react'
import { useMemo } from 'react'
import { SectionCard, DetailItem, KpiCard } from '../components'
import { GovernanceActionPanel } from '@/features/dc/components/GovernanceActionPanel/GovernanceActionPanel'
import { ModuleStatusBadge, deriveModuleStatus } from '@/features/dc/components/ModuleStatusBadge/ModuleStatusBadge'
import { Button } from '@/components/ui/button'
import { formatList } from '../utils'
import type { TempleFullProfileResponse, ProfileStagingResponse } from '@/features/dc/dcTypes'
import { DcTempleImageGallery } from '@/features/dc/components/DcTempleImageGallery'

interface OverviewTabProps {
  profile: TempleFullProfileResponse
  pendingStaging: ProfileStagingResponse | null
  canAct: boolean
  onVerifyTemple: (notes: string) => Promise<void>
  onFlagTemple: (reason: string) => Promise<void>
  onApproveProfile: (stagingId: number) => void
  onRejectProfile: (stagingId: number) => void
}

export function OverviewTab({
  profile,
  pendingStaging,
  canAct,
  onVerifyTemple,
  onFlagTemple,
  onApproveProfile,
  onRejectProfile
}: OverviewTabProps) {
  const { temple, trust, declarations, trustFinancials, hobliName, talukName, districtName, cityName } = profile

  const pendingReviewDecls = useMemo(() =>
    declarations.filter((d) => ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(d.status)),
    [declarations]
  )
  const overdueDecls = useMemo(() =>
    declarations.filter((d) => d.status === 'OVERDUE'),
    [declarations]
  )

  const mapsEmbedUrl = useMemo(() =>
    (temple.latitude && temple.longitude)
      ? `https://www.google.com/maps?q=${temple.latitude},${temple.longitude}&output=embed`
      : null,
    [temple.latitude, temple.longitude]
  )

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* Pending Profile Review Banner */}
      {pendingStaging && (
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm transition-all duration-300">
          <div className="bg-amber-100/40 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-sm">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-md font-semibold text-amber-900 leading-none tracking-section">Pending Profile Update</h3>
                <p className="text-xs text-amber-700 mt-1 font-regular opacity-80">
                  Submitted {new Date(pendingStaging.submittedAt).toLocaleDateString()} • Version {pendingStaging.version}
                </p>
              </div>
            </div>
            {canAct && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-medium border-amber-200 bg-white text-amber-700 hover:bg-amber-50 rounded-lg transition-colors tracking-button"
                  onClick={() => onRejectProfile(pendingStaging.id)}
                >
                  <X size={16} className="mr-1" /> REJECT
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs font-medium bg-amber-600 text-white shadow-sm rounded-lg hover:bg-amber-700 transition-all active:scale-95 tracking-button"
                  onClick={() => onApproveProfile(pendingStaging.id)}
                >
                  <Check size={16} className="mr-1" /> APPROVE
                </Button>
              </div>
            )}
          </div>
          <div className="p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                <DetailItem label="Contact Person" value={pendingStaging.contactPersonName} />
                <DetailItem label="Designation" value={pendingStaging.contactPersonDesignation} />
                <DetailItem label="Languages of Worship" value={formatList(pendingStaging.languagesOfWorship)} />
                <DetailItem label="Linked Institutions" value={formatList(pendingStaging.linkedInstitutions)} />
                <DetailItem label="Annual Festivals" value={formatList(pendingStaging.annualFestivals)} />
                <DetailItem label="Landmark" value={pendingStaging.landmark} />
                <div className="col-span-full pt-4 border-t border-amber-100">
                  <DetailItem label="Historical Significance" value={pendingStaging.historicalSignificance} />
                </div>
             </div>
          </div>
        </div>
      )}

      {/* KPI Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Pending Review"
          value={pendingReviewDecls.length}
          icon={<Clock size={20} />}
          variant={pendingReviewDecls.length > 0 ? 'warning' : 'neutral'}
          className="shadow-sm border-slate-200"
        />
        <KpiCard
          label="Overdue"
          value={overdueDecls.length}
          icon={<TrendingUp size={20} />}
          variant={overdueDecls.length > 0 ? 'danger' : 'neutral'}
          className="shadow-sm border-slate-200"
        />
        <KpiCard
          label="Incomes Tracked"
          value={trustFinancials.length}
          icon={<TrendingUp size={20} />}
          variant="success"
          className="shadow-sm border-slate-200"
        />
        <KpiCard
          label="Trust Status"
          value={trust ? 'Managed' : 'Individual'}
          icon={<Shield size={20} />}
          variant={trust ? 'success' : 'warning'}
          className="shadow-sm border-slate-200"
        />
      </div>

      {/* Unified Content Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content (Left + Middle) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Identity Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Building2 size={18} className="text-slate-500" />
              <h2 className="text-xs font-medium text-slate-900 uppercase tracking-label">Temple Identity & Information</h2>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Photo Side */}
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <div className="size-40 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner group transition-all">
                    {temple.photoUrl ? (
                      <img
                        src={`${import.meta.env.VITE_BASE_URL}${temple.photoUrl}`}
                        alt={temple.name || 'Temple Photo'}
                        className="object-cover w-full h-full"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <Building2 size={48} className="text-slate-300" />
                    )}
                  </div>
                  <span className="text-xs font-medium uppercase tracking-label text-slate-400">Profile Photo</span>
                </div>

                {/* Data Side */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <DetailItem label="Primary Deity" value={temple.primaryDeity || '—'} />
                  <DetailItem label="Tradition" value={temple.tradition || '—'} />
                  <DetailItem label="Year Established" value={temple.yearEstablished ? temple.yearEstablished : '—'} />
                  <DetailItem label="Registration No." value={temple.registrationNumber || '—'} />
                  <DetailItem label="Alias Name" value={temple.aliasName || '—'} />
                  <DetailItem label="Languages of Worship" value={formatList(temple.languagesOfWorship)} />
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                <DetailItem label="History" value={temple.history || '—'} />
                <DetailItem label="Linked Institutions" value={formatList(profile.currentProfile?.linkedInstitutions)} />
                <DetailItem label="Door Number" value={temple.doorNumber || '—'} />

                <DetailItem label="PIN Code" value={temple.pinCode || '—'} />
                <DetailItem label="Latitude" value={temple.latitude ?? '—'} />
                <DetailItem label="Longitude" value={temple.longitude ?? '—'} />
                <DetailItem label="Contact Name" value={temple.contactName || '—'} />
                <DetailItem label="Contact Designation" value={temple.contactDesignation || '—'} />
                <DetailItem label="Contact Mobile" value={temple.contactMobile || '—'} />
                <DetailItem label="Contact Email" value={temple.contactEmail || '—'} />
              </div>
            </div>
          </div>

          {/* Temple Photo Gallery */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <h2 className="text-xs font-medium text-slate-900 uppercase tracking-label">Temple Photo Gallery</h2>
            </div>
            <div className="p-6">
              <DcTempleImageGallery templeId={temple.id} />
            </div>
          </div>

          {/* Location & Jurisdiction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionCard title="Jurisdiction" icon={<MapPin size={18} />} className="shadow-sm border-slate-200">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <DetailItem label="District" value={districtName || '—'} />
                <DetailItem label="City" value={cityName || '—'} />
                <DetailItem label="Taluk" value={talukName || '—'} />
                <DetailItem label="Hobli" value={hobliName || '—'} />
                <div className="col-span-2">
                  <DetailItem
                    label="Street Address"
                    value={
                      [temple.doorNumber, temple.street, temple.villageTown]
                        .filter(Boolean)
                        .join(', ') || '—'
                    }
                  />
                </div>
              </dl>
            </SectionCard>

            <SectionCard title="Primary Contact" icon={<Phone size={18} />} className="shadow-sm border-slate-200">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <UserCircle size={20} className="text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{temple.contactName || '—'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-regular">{temple.contactDesignation || '—'}</p>
                  <div className="mt-3 space-y-1.5">
                    {temple.contactMobile && (
                      <a href={`tel:${temple.contactMobile}`} className="flex items-center gap-2 text-xs font-regular text-slate-600 hover:text-primary transition-colors">
                        <Phone size={12} className="text-slate-400" />
                        {temple.contactMobile}
                      </a>
                    )}
                    {temple.contactEmail && (
                      <a href={`mailto:${temple.contactEmail}`} className="flex items-center gap-2 text-xs font-regular text-slate-600 hover:text-primary transition-colors">
                        <Shield size={12} className="text-slate-400" />
                        {temple.contactEmail}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Temple Oversight — same PENDING/VERIFIED/FLAGGED pattern as all other modules */}
          {(() => {
            const templeStatus = deriveModuleStatus(
              temple.verificationStatus === 'VERIFIED',
              temple.verificationStatus === 'FLAGGED' ? (temple.dcFlagReason ?? 'Flagged by DC') : null
            )
            return (
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                {templeStatus === 'PENDING' ? (
                  <GovernanceActionPanel
                    entityName="Temple Oversight"
                    isVerified={false}
                    flagReason={null}
                    canAct={canAct}
                    onVerify={onVerifyTemple}
                    onFlag={onFlagTemple}
                  />
                ) : templeStatus === 'VERIFIED' ? (
                  <div className="flex items-center gap-3 px-5 py-4">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Temple verified by District Collector</p>
                      <p className="text-xs text-emerald-700/70 mt-0.5">Identity and registration records have been audited.</p>
                    </div>
                    {canAct && (
                      <button
                        className="ml-auto text-xs text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                        onClick={() => onFlagTemple('')}
                      >
                        Flag issue
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="px-5 py-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <Flag size={16} className="text-red-600 shrink-0" />
                      <p className="text-sm font-semibold text-red-800">Temple flagged by District Collector</p>
                    </div>
                    {temple.dcFlagReason && (
                      <p className="text-xs text-red-700 pl-7">{temple.dcFlagReason}</p>
                    )}
                    {canAct && (
                      <div className="pl-7">
                        <button
                          className="text-xs text-red-700 underline underline-offset-2 hover:text-red-900"
                          onClick={() => onVerifyTemple('')}
                        >
                          Mark as verified
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Sidebar (Right) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Map Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin size={16} className="text-slate-500" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Physical Presence</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="aspect-square w-full relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                {mapsEmbedUrl ? (
                  <iframe
                    title={`Map — ${temple.name}`}
                    src={mapsEmbedUrl}
                    width="100%"
                    height="100%"
                    loading="lazy"
                    className="block border-0 w-full h-full grayscale-[0.2]"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
                    <MapPin size={32} className="text-slate-200" />
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-tight">Geolocation data missing</p>
                    <Button
                      variant="link"
                      className="text-xs text-primary h-auto p-0 underline decoration-primary/30 underline-offset-4"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(temple.name || '')}`, '_blank')}
                    >
                      Locate on Google Maps
                    </Button>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 h-10 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm"
                onClick={() => window.open(mapsEmbedUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(temple.name || '')}`, '_blank')}
              >
                Get Directions
              </Button>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Management Type</p>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
                   <Building2 size={16} className="text-slate-400" />
                   <span className="text-sm font-semibold text-slate-700">{trust ? 'Trust Managed' : 'Individual Management'}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Administrative Grade</p>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
                   <Shield size={16} className="text-slate-400" />
                   <span className="text-sm font-semibold text-slate-700">{temple.grade ? `Grade ${temple.grade}` : 'Unclassified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}