import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { SectionCard } from './SectionCard'
import { InfoRow } from './InfoRow'
import { TagDisplay } from './TagDisplay'
import type { TempleProfileStagingResponse } from '@/features/temple-profile/hooks/templeTypes'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VersionDetailViewProps {
  version: TempleProfileStagingResponse
  onClose: () => void
}

function fmt(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function VersionDetailView({ version, onClose }: VersionDetailViewProps) {
  return (
    <div className="rounded-xl border border-border bg-background shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">Version {version.versionNumber}</h3>
          <StatusBadge status={version.statusLabel} />
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-gold">
        {/* Metadata */}
        <SectionCard title="Workflow Metadata">
          <InfoRow label="Version" value={version.versionNumber} />
          <InfoRow label="Status" value={version.statusLabel} />
          <InfoRow label="Submitted" value={fmt(version.submittedAt)} />
          <InfoRow label="Reviewed" value={fmt(version.reviewedAt)} />
          {version.reviewComment && (
            <div className="mt-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-xs font-semibold text-destructive mb-1">DC Comment</p>
              <p className="text-sm">{version.reviewComment}</p>
            </div>
          )}
          <InfoRow label="Created" value={fmt(version.createdAt)} />
          <InfoRow label="Last Updated" value={fmt(version.updatedAt)} />
        </SectionCard>

        {/* Description */}
        {version.description && (
          <SectionCard title="About Temple">
            <InfoRow label="Description" value={version.description} multiline />
            <InfoRow label="Historical Significance" value={version.historicalSignificance} multiline />
            <InfoRow label="Landmark" value={version.landmark} />
            <InfoRow label="Annual Festivals" value={version.annualFestivals} multiline />
          </SectionCard>
        )}

        {/* Cultural */}
        <SectionCard title="Cultural Details">
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground font-medium">Languages of Worship</span>
            <TagDisplay value={version.languagesOfWorship} />
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground font-medium">Linked Institutions</span>
            <TagDisplay value={version.linkedInstitutions} />
          </div>
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Contact Information">
          <InfoRow label="Contact Person" value={version.contactPersonName} />
          <InfoRow label="Designation" value={version.contactPersonDesignation} />
          <InfoRow label="Phone" value={version.phone} />
          <InfoRow label="Email" value={version.email} />
          <InfoRow label="Website" value={version.website} />
        </SectionCard>

        {/* Bank Details */}
        <SectionCard title="Bank Details (Hundi/Donation)">
          <InfoRow label="Bank Name" value={version.bankName} />
          <InfoRow label="Bank IFSC" value={version.bankIfsc} />
          <InfoRow label="Account No." value={version.bankAccountMasked} />
        </SectionCard>
      </div>
    </div>
  )
}
