import { Building2, MapPin, Phone, Shield, TrendingUp, UserCircle, Info, Clock, CreditCard, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SectionCard, DetailItem, KpiCard } from '../components'
import { GovernanceActionPanel } from '@/features/dc/components/GovernanceActionPanel/GovernanceActionPanel'
import { Button } from '@/components/ui/button'
import { formatList } from '../utils'
import type { TempleFullProfileResponse, ProfileStagingResponse, ProfileCurrentResponse } from '@/features/dc/dcTypes'
import { DcTempleImageGallery } from '@/features/dc/components/DcTempleImageGallery'

interface OverviewTabProps {
  profile: TempleFullProfileResponse
  canAct: boolean
  pendingStaging: ProfileStagingResponse | null | undefined
  onVerifyTemple: (notes: string) => Promise<void>
  onFlagTemple: (reason: string) => Promise<void>
  onApproveProfile: (stagingId: number, notes?: string) => Promise<void>
  onRejectProfile: (stagingId: number, reason: string) => Promise<void>
}

export function OverviewTab({
  profile,
  canAct,
  pendingStaging,
  onVerifyTemple,
  onFlagTemple,
  onApproveProfile,
  onRejectProfile,
}: OverviewTabProps) {
  const { temple, trust, declarations, trustFinancials, hobliName, talukName, districtName, cityName, currentProfile } = profile
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [profileSectionExpanded, setProfileSectionExpanded] = useState(true)

  const pendingReviewDecls = useMemo(() =>
    declarations.filter((d) => ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_RESPONDED'].includes(d.status)),
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
    <div className="space-y-3 pb-6 max-w-[1600px] mx-auto">
      {/* KPI Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Pending Review"
          value={pendingReviewDecls.length}
          icon={<Clock size={18} />}
          variant={pendingReviewDecls.length > 0 ? 'warning' : 'neutral'}
          className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        />
        <KpiCard
          label="Overdue"
          value={overdueDecls.length}
          icon={<TrendingUp size={18} />}
          variant={overdueDecls.length > 0 ? 'danger' : 'neutral'}
          className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        />
        <KpiCard
          label="Incomes Tracked"
          value={trustFinancials.length}
          icon={<TrendingUp size={18} />}
          variant="success"
          className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        />
        <KpiCard
          label="Trust Status"
          value={trust ? 'Managed' : 'Individual'}
          icon={<Shield size={18} />}
          variant={trust ? 'success' : 'warning'}
          className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        />
      </div>

      {/* Unified Content Container */}
      <div className="space-y-4">
        {/* Temple Identity Section - FULL WIDTH */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <Building2 size={16} className="text-white" />
            </div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Temple Identity & Information</h2>
          </div>
          
          <div className="p-3">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Left Side - Details (3/4 width) */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5">
                  <DetailItem label="Primary Deity" value={temple.primaryDeity || '—'} />
                  <DetailItem label="Tradition" value={temple.tradition || '—'} />
                  <DetailItem label="Year Established" value={temple.yearEstablished ? temple.yearEstablished : '—'} />
                  <DetailItem label="Registration No." value={temple.registrationNumber || '—'} />
                  <DetailItem label="Alias Name" value={temple.aliasName || '—'} />
                  <DetailItem label="Languages" value={formatList(temple.languagesOfWorship)} />
                  <DetailItem label="Door Number" value={temple.doorNumber || '—'} />
                  <DetailItem label="PIN Code" value={temple.pinCode || '—'} />
                  <DetailItem label="Contact Name" value={temple.contactName || '—'} />
                  <DetailItem label="Contact Mobile" value={temple.contactMobile || '—'} />
                  <DetailItem label="Contact Email" value={temple.contactEmail || '—'} />
                  <DetailItem label="Designation" value={temple.contactDesignation || '—'} />
                  {temple.website && <DetailItem label="Website" value={temple.website} />}
                  {temple.annualFestivals && <DetailItem label="Annual Festivals" value={temple.annualFestivals} />}
                  {temple.landmark && <DetailItem label="Landmark" value={temple.landmark} />}
                </div>
              </div>

              {/* Right Side - Photo (1/4 width) */}
              <div className="lg:col-span-1 flex flex-col items-center justify-start gap-2">
                <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center overflow-hidden border-2 border-orange-200/60 shadow-lg group transition-all hover:shadow-xl hover:scale-105 duration-300">
                  {temple.photoUrl ? (
                    <img
                      src={`${import.meta.env.VITE_BASE_URL}${temple.photoUrl}`}
                      alt={temple.name || 'Temple Photo'}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <Building2 size={48} className="text-orange-300 group-hover:text-orange-400 transition-colors" />
                  )}
                </div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Primary Photo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Temple Photo Gallery - FULL WIDTH */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Building2 size={16} className="text-white" />
            </div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Temple Photo Gallery</h2>
          </div>
          <div className="p-3">
            <DcTempleImageGallery templeId={temple.id} />
          </div>
        </div>

        {/* 2-COLUMN LAYOUT for smaller cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Location & Jurisdiction */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <MapPin size={16} className="text-white" />
              </div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Jurisdiction</h2>
            </div>
            <div className="p-3">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
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
            </div>
          </div>

          {/* Primary Contact */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                <Phone size={16} className="text-white" />
              </div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Primary Contact</h2>
            </div>
            <div className="p-3">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200/60 flex items-center justify-center shrink-0">
                  <UserCircle size={20} className="text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900">{temple.contactName || '—'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-regular">{temple.contactDesignation || '—'}</p>
                  <div className="mt-2 space-y-1">
                    {temple.contactMobile && (
                      <a href={`tel:${temple.contactMobile}`} className="flex items-center gap-1.5 text-[10px] font-regular text-slate-600 hover:text-purple-600 transition-colors">
                        <Phone size={10} className="text-purple-400" />
                        {temple.contactMobile}
                      </a>
                    )}
                    {temple.contactEmail && (
                      <a href={`mailto:${temple.contactEmail}`} className="flex items-center gap-1.5 text-[10px] font-regular text-slate-600 hover:text-purple-600 transition-colors">
                        <Shield size={10} className="text-purple-400" />
                        {temple.contactEmail}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Card */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-sky-50 flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-md">
                <MapPin size={14} className="text-white" />
              </div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Physical Location</h2>
            </div>
            <div className="p-3">
              <div className="aspect-video w-full relative rounded-lg overflow-hidden border-2 border-cyan-200/60 bg-cyan-50 shadow-inner">
                {mapsEmbedUrl ? (
                  <iframe
                    title={`Map — ${temple.name}`}
                    src={mapsEmbedUrl}
                    width="100%"
                    height="100%"
                    loading="lazy"
                    className="block border-0 w-full h-full"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-1.5 text-center p-3">
                    <MapPin size={20} className="text-cyan-200" />
                    <p className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">No Location Data</p>
                    <Button
                      variant="link"
                      className="text-[10px] text-cyan-600 h-auto p-0 underline decoration-cyan-600/30 underline-offset-2 hover:text-cyan-700"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(temple.name || '')}`, '_blank')}
                    >
                      Search on Maps
                    </Button>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2.5 h-7 text-[10px] font-bold border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300 rounded-lg shadow-sm transition-all"
                onClick={() => window.open(mapsEmbedUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(temple.name || '')}`, '_blank')}
              >
                Get Directions
              </Button>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50 flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-md">
                <Shield size={14} className="text-white" />
              </div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Stats</h2>
            </div>
            <div className="p-3 space-y-2.5">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">Management Type</p>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200/60 shadow-sm">
                   <Building2 size={14} className="text-amber-600" />
                   <span className="text-xs font-semibold text-slate-700">{trust ? 'Trust Managed' : 'Individual'}</span>
                </div>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">Administrative Grade</p>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200/60 shadow-sm">
                   <Shield size={14} className="text-emerald-600" />
                   <span className="text-xs font-semibold text-slate-700">{temple.grade ? `Grade ${temple.grade}` : 'Unclassified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Temple Oversight - FULL WIDTH */}
        {(() => {
          const isVerified = temple.verificationStatus === 'VERIFIED'
          const flagReason = temple.verificationStatus === 'FLAGGED' ? (temple.dcFlagReason ?? 'Flagged by DC') : null
          return (
            <div className="rounded-xl overflow-hidden border border-slate-200/60 shadow-md bg-white hover:shadow-lg transition-all duration-300">
              <GovernanceActionPanel
                entityName="Temple Oversight"
                isVerified={isVerified}
                flagReason={flagReason}
                canAct={canAct}
                onVerify={onVerifyTemple}
                onFlag={onFlagTemple}
              />
            </div>
          )
        })()}

        {/* Pending Profile Review - FULL WIDTH (shown only when TA has submitted staging) */}
        {pendingStaging && (
          <div className="bg-white rounded-xl border-2 border-amber-300/70 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="px-4 py-2.5 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                  <Clock size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pending Profile Submission — Awaiting Review</h2>
                  <p className="text-[10px] text-amber-700 font-medium">Version {pendingStaging.version} · Submitted by Temple Authority</p>
                </div>
              </div>
              <button
                className="text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setProfileSectionExpanded((p) => !p)}
                aria-label="Toggle profile section"
              >
                {profileSectionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {profileSectionExpanded && (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5">
                  <DetailItem label="Contact Person" value={pendingStaging.contactPersonName || '—'} />
                  <DetailItem label="Designation" value={pendingStaging.contactPersonDesignation || '—'} />
                  <DetailItem label="Phone" value={pendingStaging.phone || '—'} />
                  <DetailItem label="Email" value={pendingStaging.email || '—'} />
                  <DetailItem label="Website" value={pendingStaging.website || '—'} />
                  <DetailItem label="Languages of Worship" value={pendingStaging.languagesOfWorship || '—'} />
                  <DetailItem label="Bank Name" value={pendingStaging.bankName || '—'} />
                  <DetailItem label="Bank Account (masked)" value={pendingStaging.bankAccountNumberMasked || '—'} />
                  <DetailItem label="Bank IFSC" value={pendingStaging.bankIfsc || '—'} />
                  <DetailItem label="Annual Festivals" value={pendingStaging.annualFestivals || '—'} />
                  <DetailItem label="Landmark" value={pendingStaging.landmark || '—'} />
                </div>
                {pendingStaging.description && (
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">Description</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{pendingStaging.description}</p>
                  </div>
                )}
                {pendingStaging.historicalSignificance && (
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">Historical Significance</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{pendingStaging.historicalSignificance}</p>
                  </div>
                )}
                {canAct && (
                  <div className="pt-3 border-t border-amber-100 space-y-2">
                    {showRejectInput ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Provide the rejection reason (required, min 10 characters)…"
                          rows={3}
                          className="w-full text-xs rounded-lg border border-red-200 bg-red-50/50 p-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs font-bold px-3"
                            disabled={rejectReason.trim().length < 10}
                            onClick={() => {
                              onRejectProfile(pendingStaging.id, rejectReason)
                              setShowRejectInput(false)
                              setRejectReason('')
                            }}
                          >
                            Confirm Reject
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setShowRejectInput(false); setRejectReason('') }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4"
                          onClick={() => onApproveProfile(pendingStaging.id)}
                        >
                          Approve Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-bold border-red-300 text-red-600 hover:bg-red-50 px-4"
                          onClick={() => setShowRejectInput(true)}
                        >
                          Reject Profile
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Approved Account Details - FULL WIDTH (shown when a profile has been approved) */}
        {currentProfile && (
          <div className="bg-white rounded-xl border border-emerald-200/70 shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="px-4 py-2.5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <CreditCard size={16} className="text-white" />
              </div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Approved Account Details</h2>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5">
                <DetailItem label="Contact Person" value={currentProfile.contactPersonName || '—'} />
                <DetailItem label="Designation" value={currentProfile.contactPersonDesignation || '—'} />
                <DetailItem label="Phone" value={currentProfile.phone || '—'} />
                <DetailItem label="Email" value={currentProfile.email || '—'} />
                <DetailItem label="Website" value={currentProfile.website || '—'} />
                <DetailItem label="Bank Name" value={currentProfile.bankName || '—'} />
                <DetailItem label="Bank Account (masked)" value={currentProfile.bankAccountMasked || '—'} />
                <DetailItem label="Bank IFSC" value={currentProfile.bankIfsc || '—'} />
                <DetailItem label="Languages of Worship" value={currentProfile.languagesOfWorship || '—'} />
                <DetailItem label="Annual Festivals" value={currentProfile.annualFestivals || '—'} />
                <DetailItem label="Landmark" value={currentProfile.landmark || '—'} />
              </div>
              {currentProfile.description && (
                <div className="mt-2.5">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">Description</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{currentProfile.description}</p>
                </div>
              )}
              {currentProfile.historicalSignificance && (
                <div className="mt-2.5">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">Historical Significance</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{currentProfile.historicalSignificance}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
