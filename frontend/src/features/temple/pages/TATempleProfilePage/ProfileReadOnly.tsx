import { cn } from '@/lib/utils'
import type { TaCurrentProfileResponse, TempleProfileStagingResponse } from '@/features/temple/templeTypes'

type ProfileData = TaCurrentProfileResponse | TempleProfileStagingResponse | null

interface ProfileReadOnlyProps {
  profile: ProfileData
}

interface FieldRowProps {
  label: string
  value: string | number | undefined | null
  wide?: boolean
}

function FieldRow({ label, value, wide }: FieldRowProps) {
  return (
    <div className={cn(wide && 'sm:col-span-2')}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value ?? <span className="text-muted-foreground italic">Not provided</span>}</p>
    </div>
  )
}

export function ProfileReadOnly({ profile }: ProfileReadOnlyProps) {
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-foreground">No profile data available</p>
        <p className="text-xs text-muted-foreground mt-1">Profile information will appear here once submitted.</p>
      </div>
    )
  }

  const hasContact =
    profile.phone || profile.email || profile.website ||
    profile.contactPersonName || profile.contactPersonDesignation

  const hasDetails =
    profile.languagesOfWorship || profile.linkedInstitutions ||
    profile.description || profile.annualFestivals

  return (
    <div className="space-y-6">
      {/* Contact information */}
      {hasContact && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Contact Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <FieldRow label="Contact Person Name" value={profile.contactPersonName} />
            <FieldRow label="Designation" value={profile.contactPersonDesignation} />
            <FieldRow label="Phone" value={profile.phone} />
            <FieldRow label="Email" value={profile.email} />
            {profile.website && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Website</p>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {profile.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Temple details */}
      {hasDetails && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Temple Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <FieldRow label="Languages of Worship" value={profile.languagesOfWorship} />
            <FieldRow label="Linked Institution / Mutt" value={profile.linkedInstitutions} />
            {profile.description && <FieldRow label="Description" value={profile.description} wide />}
            {profile.annualFestivals && <FieldRow label="Annual Festivals & Events" value={profile.annualFestivals} wide />}
          </div>
        </div>
      )}

      {'reviewComment' in profile && profile.reviewComment && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">DC Review Comment</p>
          <p className="text-sm text-destructive/90">{profile.reviewComment}</p>
        </div>
      )}
    </div>
  )
}
