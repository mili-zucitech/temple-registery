import { cn } from '@/lib/utils'
import type { TaCurrentProfileResponse, TempleProfileStagingResponse } from '@/features/temple/templeTypes'

interface ProfileDiffViewProps {
  current: TaCurrentProfileResponse
  staging: TempleProfileStagingResponse
}

interface DiffField {
  label: string
  currentVal: string | undefined | null
  stagingVal: string | undefined | null
}

function DiffRow({ label, currentVal, stagingVal }: DiffField) {
  const changed = (currentVal ?? '') !== (stagingVal ?? '')
  return (
    <div className={cn('grid grid-cols-2 gap-4 py-3 border-b border-border last:border-0', changed && 'bg-warning/5 -mx-4 px-4 rounded-lg')}>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <p className={cn('text-sm', !currentVal && 'text-muted-foreground italic')}>
          {currentVal ?? 'Not provided'}
        </p>
      </div>
      <div>
        <p className={cn(
          'text-[10px] font-medium uppercase tracking-wider mb-0.5',
          changed ? 'text-warning' : 'text-muted-foreground',
        )}>
          {changed ? '⟶ Changed' : 'No change'}
        </p>
        <p className={cn('text-sm font-medium', changed && 'text-warning', !stagingVal && 'text-muted-foreground italic')}>
          {stagingVal ?? 'Not provided'}
        </p>
      </div>
    </div>
  )
}

export function ProfileDiffView({ current, staging }: ProfileDiffViewProps) {
  const fields: DiffField[] = [
    { label: 'Contact Person Name',        currentVal: current.contactPersonName,        stagingVal: staging.contactPersonName },
    { label: 'Designation',                currentVal: current.contactPersonDesignation, stagingVal: staging.contactPersonDesignation },
    { label: 'Phone',                      currentVal: current.phone,                   stagingVal: staging.phone },
    { label: 'Email',                      currentVal: current.email,                   stagingVal: staging.email },
    { label: 'Website',                    currentVal: current.website,                 stagingVal: staging.website },
    { label: 'Languages of Worship',       currentVal: current.languagesOfWorship,      stagingVal: staging.languagesOfWorship },
    { label: 'Linked Institution / Mutt',  currentVal: current.linkedInstitutions,      stagingVal: staging.linkedInstitutions },
    { label: 'Description',               currentVal: current.description,              stagingVal: staging.description },
    { label: 'Annual Festivals',           currentVal: current.annualFestivals,         stagingVal: staging.annualFestivals },
  ]

  const changedCount = fields.filter(f => (f.currentVal ?? '') !== (f.stagingVal ?? '')).length

  return (
    <div>
      {/* Column headers */}
      <div className="grid grid-cols-2 gap-4 pb-3 mb-2 border-b-2 border-border">
        <div>
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Current (Live)</p>
          <p className="text-[11px] text-muted-foreground">Approved &amp; visible to DC</p>
        </div>
        <div>
          <p className="text-xs font-bold text-warning uppercase tracking-wider">Pending Draft</p>
          <p className="text-[11px] text-muted-foreground">
            {changedCount} field{changedCount !== 1 ? 's' : ''} changed — awaiting DC approval
          </p>
        </div>
      </div>

      {/* Diff rows */}
      <div>
        {fields.map(f => (
          <DiffRow key={f.label} {...f} />
        ))}
      </div>
    </div>
  )
}
