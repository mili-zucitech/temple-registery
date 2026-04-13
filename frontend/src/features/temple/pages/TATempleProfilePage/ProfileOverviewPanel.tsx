import {
  Building2, MapPin, Phone, Mail, Globe, Calendar, BookOpen,
  Users, Star, Info, Link2, Navigation, BadgeCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import type { TempleResponse, TaCurrentProfileResponse, TempleProfileStagingResponse, TaProfileStatus } from '@/features/temple/templeTypes'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import { GpsMap, GpsMapPlaceholder } from './GpsMap'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileData = TaCurrentProfileResponse | TempleProfileStagingResponse | null

interface ProfileOverviewPanelProps {
  temple: TempleResponse
  currentProfile: ProfileData
  stagingProfile: ProfileData
  profileStatus: TaProfileStatus
  talukName?: string
  hobliName?: string
  onEditClick?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRADITION_LABELS: Record<string, string> = {
  SHAIVITE: 'Shaivite', VAISHNAVITE: 'Vaishnavite', SHAKTA: 'Shakta',
  JAIN: 'Jain', BUDDHIST: 'Buddhist', OTHER: 'Other',
}

function InfoRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-sm text-foreground', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

function SectionCard({
  icon, title, children, className, accent,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  className?: string
  accent?: string  // Tailwind bg class e.g. 'bg-amber-400'
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card overflow-hidden shadow-soft-sm', className)}>
      {accent && <div className={cn('h-[3px] w-full', accent)} />}
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0">
            {icon}
          </div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}

function EmptyProfilePrompt({ onEditClick }: { onEditClick?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-3 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Info size={20} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Contact details not yet submitted</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add your temple's contact information and submit for DC review.
        </p>
      </div>
      {onEditClick && (
        <button
          onClick={onEditClick}
          className="text-xs text-primary hover:underline font-medium"
        >
          Go to Edit Profile →
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileOverviewPanel({
  temple,
  currentProfile,
  stagingProfile,
  profileStatus,
  talukName,
  hobliName,
  onEditClick,
}: ProfileOverviewPanelProps) {
  // Fetch current user info for fallback contact
  const { data: userData } = useGetCurrentUserQuery()
  const user = userData?.data
  // Contact data: DRAFT staging takes priority, then current, then registration
  const profileData = stagingProfile ?? currentProfile
  // For worship/operations, prefer staging if present, else current, else registration
  const worshipSource = stagingProfile ?? currentProfile ?? temple

  // Full address components
  const addressParts = [
    temple.doorNumber && `Door No. ${temple.doorNumber}`,
    temple.street,
    temple.villageTown,
    hobliName && `${hobliName} Hobli`,
    talukName && `${talukName} Taluk`,
    temple.pinCode && `PIN ${temple.pinCode}`,
  ].filter(Boolean)

  const hasGps = typeof temple.latitude === 'number' && typeof temple.longitude === 'number'

  const hasContactData =
    profileData?.contactPersonName ||
    profileData?.phone ||
    profileData?.email ||
    profileData?.website ||
    temple.contactName ||
    temple.contactMobile ||
    temple.contactEmail ||
    user?.fullName || user?.mobile || user?.email

  const hasWorshipData =
    worshipSource?.languagesOfWorship ||
    worshipSource?.linkedInstitutions ||
    worshipSource?.description ||
    worshipSource?.annualFestivals

  return (
    <div className="space-y-4">
      {/* ── 1. Temple Identity ─────────────────────────────────────────── */}
      <SectionCard
        accent="bg-amber-400"
        icon={<Building2 size={16} className="text-amber-600" />}
        title="Temple Identity"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Temple Name</p>
            <p className="text-base font-semibold text-foreground">{temple.name}</p>
            {temple.aliasName && (
              <p className="text-xs text-muted-foreground mt-0.5">Also known as: {temple.aliasName}</p>
            )}
          </div>

          <InfoRow label="Primary Deity" value={temple.primaryDeity} />
          <InfoRow label="Religious Tradition" value={temple.tradition ? TRADITION_LABELS[temple.tradition] ?? temple.tradition : null} />

          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Grade</p>
              <span className="inline-flex items-center rounded-full bg-amber-400 border border-amber-300/60 px-2.5 py-0.5 text-xs font-extrabold text-amber-900">
                Grade {temple.grade}
              </span>
            </div>
          </div>

          {temple.registrationNumber && (
            <InfoRow label="Registration Number" value={temple.registrationNumber} />
          )}

          {temple.yearEstablished && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Year Established</p>
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-muted-foreground" />
                <p className="text-sm text-foreground">{temple.yearEstablished}</p>
              </div>
            </div>
          )}

          {temple.history && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Historical Significance</p>
              <p className="text-sm text-foreground leading-relaxed">{temple.history}</p>
            </div>
          )}
        </div>

        {/* Status + Profile Status */}
        <div className="mt-4 pt-3 border-t border-border flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Profile Status:</span>
            <StatusBadge status={profileStatus} />
          </div>
          {(stagingProfile && profileStatus === 'DRAFT') && (
            <span className="text-[11px] text-warning font-medium">• Draft pending submission</span>
          )}
          {profileStatus === 'SUBMITTED' && (
            <span className="text-[11px] text-info font-medium">• Under DC review</span>
          )}
        </div>
      </SectionCard>

      {/* ── 2. Location ────────────────────────────────────────────────── */}
      <SectionCard
        accent="bg-sky-400"
        icon={<MapPin size={16} className="text-sky-600" />}
        title="Temple Location"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            {addressParts.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Full Address</p>
                <p className="text-sm text-foreground leading-relaxed">{addressParts.join(', ')}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="District" value={`District #${temple.districtId}`} />
              {talukName && <InfoRow label="Taluk" value={talukName} />}
              {hobliName && <InfoRow label="Hobli" value={hobliName} />}
              {temple.pinCode && <InfoRow label="PIN Code" value={temple.pinCode} mono />}
            </div>

            {temple.landmark && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Landmark</p>
                <div className="flex items-center gap-1.5">
                  <Navigation size={12} className="text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-foreground">{temple.landmark}</p>
                </div>
              </div>
            )}

            {hasGps && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">GPS Coordinates</p>
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-foreground">
                  {temple.latitude!.toFixed(6)}° N, {temple.longitude!.toFixed(6)}° E
                </span>
              </div>
            )}
          </div>

          {/* Map */}
          <div>
            {hasGps ? (
              <GpsMap
                latitude={temple.latitude!}
                longitude={temple.longitude!}
                templeName={temple.name}
              />
            ) : (
              <GpsMapPlaceholder />
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── 3. Contact Information ─────────────────────────────────────── */}
      <SectionCard
        accent="bg-emerald-500"
        icon={<Phone size={16} className="text-emerald-700" />}
        title="Contact Information"
      >
        {(temple.contactName || temple.contactMobile || temple.contactEmail || user?.fullName || user?.mobile || user?.email) ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {temple.contactName && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Legal Contact Person</p>
                  <p className="text-sm font-semibold text-foreground">{temple.contactName}</p>
                  {temple.contactDesignation && (
                    <p className="text-xs text-muted-foreground mt-0.5">{temple.contactDesignation}</p>
                  )}
                </div>
              )}
              {temple.contactMobile && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Phone</p>
                  <a href={`tel:${temple.contactMobile}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                    <Phone size={12} />
                    {temple.contactMobile}
                  </a>
                </div>
              )}
              {temple.contactEmail && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Email</p>
                  <a href={`mailto:${temple.contactEmail}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                    <Mail size={12} />
                    {temple.contactEmail}
                  </a>
                </div>
              )}
              {/* Fallback to user info if temple contact not present */}
              {!temple.contactName && user?.fullName && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Registered User</p>
                  <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                </div>
              )}
              {!temple.contactMobile && user?.mobile && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">User Mobile</p>
                  <a href={`tel:${user.mobile}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                    <Phone size={12} />
                    {user.mobile}
                  </a>
                </div>
              )}
              {!temple.contactEmail && user?.email && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">User Email</p>
                  <a href={`mailto:${user.email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                    <Mail size={12} />
                    {user.email}
                  </a>
                </div>
              )}
            </div>

            {(profileData?.contactPersonName || profileData?.phone || profileData?.email || profileData?.website) && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck size={13} className="text-emerald-600" />
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Updated Profile Contact</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                  {profileData?.contactPersonName && (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Contact Person</p>
                      <p className="text-sm font-medium text-foreground">{profileData.contactPersonName}</p>
                      {profileData?.contactPersonDesignation && (
                        <p className="text-xs text-muted-foreground">{profileData.contactPersonDesignation}</p>
                      )}
                    </div>
                  )}
                  {profileData?.phone && (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Phone</p>
                      <a href={`tel:${profileData.phone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Phone size={12} />{profileData.phone}
                      </a>
                    </div>
                  )}
                  {profileData?.email && (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Email</p>
                      <a href={`mailto:${profileData.email}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Mail size={12} />{profileData.email}
                      </a>
                    </div>
                  )}
                  {profileData?.website && (
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Website</p>
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Globe size={12} />{profileData.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Contact details from registration or user profile.{' '}
              {onEditClick && (
                <button onClick={onEditClick} className="text-primary hover:underline">Update in Edit Profile &rarr;</button>
              )}
            </p>
          </div>
        ) : (
          <EmptyProfilePrompt onEditClick={onEditClick} />
        )}
      </SectionCard>

      {/* ── 4. Worship & Operations ────────────────────────────────────── */}
      <SectionCard
        accent="bg-violet-500"
        icon={<Star size={16} className="text-violet-600" />}
        title="Worship & Operations"
      >
        {hasWorshipData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {worshipSource?.languagesOfWorship && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Languages of Worship</p>
                  <div className="flex flex-wrap gap-1.5">
                    {worshipSource.languagesOfWorship
                      .split(',')
                      .map(l => l.trim())
                      .filter(Boolean)
                      .map(lang => (
                        <span key={lang} className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {lang}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {profileData?.linkedInstitutions && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Linked Institution / Mutt</p>
                  <div className="flex items-center gap-1.5">
                    <Link2 size={12} className="text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-foreground">{profileData.linkedInstitutions}</p>
                  </div>
                </div>
              )}
            </div>

            {profileData?.description && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Temple Description</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{profileData.description}</p>
              </div>
            )}

            {profileData?.annualFestivals && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <BookOpen size={12} className="text-muted-foreground" />
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Annual Festivals & Events</p>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{profileData.annualFestivals}</p>
              </div>
            )}
          </div>
        ) : (
          <EmptyProfilePrompt onEditClick={onEditClick} />
        )}
      </SectionCard>

      {/* ── 5. Temple Photo ────────────────────────────────────────────── */}
      {(temple.photoUrl ?? (profileData && 'photoFilePath' in profileData ? profileData.photoFilePath : null)) && (
        <SectionCard accent="bg-amber-300" icon={<Users size={16} className="text-amber-700" />} title="Temple Photograph">
          <div className="flex justify-center">
            <img
              src={temple.photoUrl ?? (profileData && 'photoFilePath' in profileData ? profileData.photoFilePath ?? '' : '')}
              alt={`${temple.name} photograph`}
              className="max-h-80 rounded-xl object-cover border border-border shadow-soft-sm"
            />
          </div>
        </SectionCard>
      )}
    </div>
  )
}
