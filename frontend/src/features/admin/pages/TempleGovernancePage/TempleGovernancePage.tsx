import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  useSuspendTempleMutation, useReactivateTempleMutation,
  useFreezeTempleMutation, useArchiveTempleMutation,
} from '@/features/admin/adminApi'
import { useSearchTemplesQuery } from '@/features/temple-profile/hooks/templeApi'
import type { TempleSearchResultResponse } from '@/features/temple-profile/hooks/templeTypes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Archive, Pause, Play, Snowflake, Search, Building2, Star, Info, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  FROZEN: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-gray-100 text-gray-700',
}

interface TempleSelectorProps {
  selected: TempleSearchResultResponse | null
  onSelect: (t: TempleSearchResultResponse | null) => void
}

function TempleSelector({ selected, onSelect }: TempleSelectorProps) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [declarationStatus, setDeclarationStatus] = useState('')
  const [verificationRequired, setVerificationRequired] = useState<boolean | undefined>(undefined)
  const [pendingProfileReview, setPendingProfileReview] = useState<boolean | undefined>(undefined)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedKeyword(inputValue), 350)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [inputValue])

  const filters: Record<string, unknown> = { name: debouncedKeyword }
  if (declarationStatus) filters.declarationStatus = declarationStatus
  if (verificationRequired !== undefined) filters.verificationRequired = verificationRequired
  if (pendingProfileReview !== undefined) filters.pendingProfileReview = pendingProfileReview

  const { data, isFetching } = useSearchTemplesQuery(
    { filters, page: 0, size: 10 },
    { skip: false }
  )
  const results = data?.data?.content ?? []

  const handleSelect = (t: TempleSearchResultResponse) => { onSelect(t); setOpen(false); setInputValue('') }
  const handleClear = () => { onSelect(null); setInputValue(''); setOpen(false) }

  if (selected) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold leading-tight">{selected.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selected.tradition} · {selected.districtName ?? selected.city ?? `District #${selected.districtId}`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600">
              <X size={14} />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {selected.grade && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                <Star size={10} /> Grade {selected.grade}
              </span>
            )}
            {(selected as any).status && (
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_STYLE[(selected as any).status] ?? 'bg-muted text-muted-foreground')}>
                {(selected as any).status}
              </span>
            )}
            <span className={cn('text-xs px-2 py-0.5 rounded-full', selected.trustRegistered ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
              {selected.trustRegistered ? 'Trust registered' : 'No trust'}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Info size={10} /> Temple ID: {selected.id}
            </span>
          </div>
        </div>
        <div className="px-5 py-2.5 flex items-center gap-2 bg-muted/20">
          <Info size={13} className="text-amber-600 shrink-0" />
          <p className="text-xs text-muted-foreground">Select an action below. All lifecycle changes are permanently logged.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={declarationStatus}
          onChange={(e) => setDeclarationStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Declaration Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={verificationRequired === undefined ? '' : String(verificationRequired)}
          onChange={(e) => setVerificationRequired(e.target.value === '' ? undefined : e.target.value === 'true')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Any Verification</option>
          <option value="true">Verification Required</option>
          <option value="false">No Verification Required</option>
        </select>
        <select
          value={pendingProfileReview === undefined ? '' : String(pendingProfileReview)}
          onChange={(e) => setPendingProfileReview(e.target.value === '' ? undefined : e.target.value === 'true')}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Any Profile Status</option>
          <option value="true">Pending Review</option>
          <option value="false">Not Pending Review</option>
        </select>
      </div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search by temple name, registration number, or deity…"
          className="pl-9 h-11 bg-background text-base"
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
          {results.length === 0 && !isFetching ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No temples found matching "{debouncedKeyword}"</div>
          ) : (
            <ul>
              {results.map((t: TempleSearchResultResponse) => (
                <li key={t.id}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(t)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.tradition} · {t.districtName ?? t.city ?? `District #${t.districtId}`}
                      </p>
                    </div>
                    {t.grade && <span className="text-xs font-bold text-amber-600 shrink-0">Grade {t.grade}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

interface ActionCardProps {
  label: string
  description: string
  icon: React.ReactNode
  accentClass: string
  confirmVariant: 'default' | 'destructive'
  irreversible?: boolean
  onAction: (args: { id: number; reason: string }) => Promise<unknown>
  onSuccess?: () => void
  isLoading: boolean
  templeId: number | null
}

function ActionCard({ label, description, icon, accentClass, confirmVariant, irreversible, onAction, onSuccess, isLoading, templeId }: ActionCardProps) {
  const [reason, setReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirm = async () => {
    if (!templeId) return
    try {
      await onAction({ id: templeId, reason })
      toast.success(`Temple #${templeId}: ${label} applied successfully`)
      setReason('')
      setConfirmOpen(false)
      onSuccess?.()
    } catch (err: any) {
      const msg = err?.data?.message || `Failed to ${label.toLowerCase()} temple #${templeId}`
      toast.error(msg)
      setConfirmOpen(false)
    }
  }

  const canSubmit = Boolean(templeId && reason.trim().length >= 5 && !isLoading)

  return (
    <Card className={cn('relative overflow-hidden transition-all duration-200', !templeId && 'opacity-60')}>
      <div className={cn('absolute inset-y-0 left-0 w-1', accentClass)} />
      <CardHeader className="pb-3 pl-6">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm font-semibold">{label}</CardTitle>
          {irreversible && (
            <span className="ml-auto text-[10px] font-bold uppercase text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
              Irreversible
            </span>
          )}
        </div>
        <CardDescription className="text-xs leading-relaxed mt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pl-6 space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            Reason <span className="text-red-500">*</span>
            <span className="text-muted-foreground font-normal ml-1">(min. 5 characters)</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={!templeId ? 'Select a temple first…' : `Reason for ${label.toLowerCase()}…`}
            className="resize-none h-16 text-sm"
            disabled={!templeId}
          />
        </div>
        <Button variant={confirmVariant} size="sm" className="w-full" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
          {isLoading ? 'Processing…' : `${label} Temple`}
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={`Confirm: ${label} Temple #${templeId}`}
          description={`This will ${label.toLowerCase()} temple #${templeId}. Reason: "${reason}". This action is permanently logged.`}
          confirmLabel={label}
          confirmVariant={confirmVariant}
          onConfirm={handleConfirm}
        />
      </CardContent>
    </Card>
  )
}

export function TempleGovernancePage() {
  const [selectedTemple, setSelectedTemple] = useState<TempleSearchResultResponse | null>(null)
  const templeId = selectedTemple?.id ?? null

  const [suspend, { isLoading: suspending }] = useSuspendTempleMutation()
  const [reactivate, { isLoading: reactivating }] = useReactivateTempleMutation()
  const [freeze, { isLoading: freezing }] = useFreezeTempleMutation()
  const [archive, { isLoading: archiving }] = useArchiveTempleMutation()

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={20} className="text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Temple Governance</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage temple lifecycle status. Search for a temple by name, verify the details, then apply an action with a reason.
          All actions are permanently logged in the governance audit trail.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Search size={13} /> Step 1 — Find the temple
        </Label>
        <TempleSelector selected={selectedTemple} onSelect={setSelectedTemple} />
      </div>

      <div className="space-y-2">
        <Label className={cn('text-sm font-semibold flex items-center gap-1.5', !selectedTemple && 'text-muted-foreground')}>
          <ChevronDown size={13} /> Step 2 — Choose an action
          {!selectedTemple && <span className="text-xs font-normal text-muted-foreground ml-1">(select a temple above first)</span>}
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            label="Suspend"
            description="Immediately blocks Temple Authority write access and DC declaration actions. The temple remains in the registry but no changes are allowed. Reversible via Reactivate."
            icon={<Pause size={15} className="text-amber-600" />}
            accentClass="bg-amber-400"
            confirmVariant="destructive"
            onAction={(args) => suspend(args).unwrap()}
            onSuccess={() => setSelectedTemple(null)}
            isLoading={suspending}
            templeId={templeId}
          />
          <ActionCard
            label="Reactivate"
            description="Restores a suspended or frozen temple back to full active status. All previously blocked actions are re-enabled."
            icon={<Play size={15} className="text-emerald-600" />}
            accentClass="bg-emerald-400"
            confirmVariant="default"
            onAction={(args) => reactivate(args).unwrap()}
            onSuccess={() => setSelectedTemple(null)}
            isLoading={reactivating}
            templeId={templeId}
          />
          <ActionCard
            label="Freeze"
            description="Blocks submission of new declarations while the temple is under administrative review. Existing data remains accessible. Reversible via Reactivate."
            icon={<Snowflake size={15} className="text-blue-600" />}
            accentClass="bg-blue-400"
            confirmVariant="default"
            onAction={(args) => freeze(args).unwrap()}
            onSuccess={() => setSelectedTemple(null)}
            isLoading={freezing}
            templeId={templeId}
          />
          <ActionCard
            label="Archive"
            description="Sets the temple to a terminal state. No further edits, declarations, or actions are allowed. Cannot be undone."
            icon={<Archive size={15} className="text-red-600" />}
            accentClass="bg-red-500"
            confirmVariant="destructive"
            irreversible
            onAction={(args) => archive(args).unwrap()}
            onSuccess={() => setSelectedTemple(null)}
            isLoading={archiving}
            templeId={templeId}
          />
        </div>
      </div>
    </div>
  )
}
