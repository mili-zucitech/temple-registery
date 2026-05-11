import { useMemo, useState } from 'react'
import { useListSystemConfigQuery, useUpdateSystemConfigMutation } from '../../adminApi'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Search, Clock, Bell, Zap, RotateCcw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'

// ─── Metadata map ─────────────────────────────────────────────────────────────

interface ConfigMeta {
  label: string
  description: string
  unit?: string
}

const CONFIG_METADATA: Record<string, ConfigMeta> = {
  'sla.declaration.review_days': {
    label: 'Declaration Review SLA',
    description: 'Number of days a District Coordinator has to review a submitted declaration before it is flagged as overdue.',
    unit: 'days',
  },
  'sla.temple_profile.review_days': {
    label: 'Temple Profile Review SLA',
    description: 'Days allowed for DC to review a temple profile staging submission before escalation.',
    unit: 'days',
  },
  'sla.clarification.response_days': {
    label: 'Clarification Response Window',
    description: 'Days the Temple Authority has to respond to a clarification request raised by the DC.',
    unit: 'days',
  },
  'notification.email.enabled': {
    label: 'Email Notifications',
    description: 'Master switch for all outgoing email notifications across the platform. Disabling this suppresses all emails.',
  },
  'notification.inapp.enabled': {
    label: 'In-App Notifications',
    description: 'Master switch for the in-app notification inbox for all user roles.',
  },
  'feature.evidence_pack.enabled': {
    label: 'Evidence Pack Generation',
    description: 'Enables generation and download of declaration evidence packs for audit and legal purposes.',
  },
  'feature.observation.enabled': {
    label: 'Compliance Observations',
    description: 'Enables the auditor observation and flagging workflow for compliance monitoring.',
  },
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  SLA: { label: 'SLA Thresholds', icon: <Clock size={15} />, color: 'text-amber-600' },
  NOTIFICATION: { label: 'Notifications', icon: <Bell size={15} />, color: 'text-blue-600' },
  FEATURE: { label: 'Feature Flags', icon: <Zap size={15} />, color: 'text-purple-600' },
}

// ─── Config Row ───────────────────────────────────────────────────────────────

interface SystemConfigResponse {
  id: number
  configKey: string
  configValue: string
  dataType: string
  category: string
  description?: string
  active: boolean
}

interface ConfigRowProps {
  cfg: SystemConfigResponse
  draftValue: string | undefined
  onDraftChange: (key: string, value: string) => void
  onSave: (key: string) => void
  onReset: (key: string) => void
  isSaving: boolean
}

function ConfigRow({ cfg, draftValue, onDraftChange, onSave, onReset, isSaving }: ConfigRowProps) {
  const meta = CONFIG_METADATA[cfg.configKey]
  const label = meta?.label ?? cfg.configKey
  const description = meta?.description ?? cfg.description ?? ''
  const unit = meta?.unit
  const effectiveValue = draftValue ?? cfg.configValue
  const isDirty = draftValue !== undefined

  const renderInput = () => {
    if (cfg.dataType === 'BOOLEAN') {
      const checked = effectiveValue === 'true'
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={checked}
            onCheckedChange={(val) => onDraftChange(cfg.configKey, val ? 'true' : 'false')}
          />
          <span className={cn('text-sm font-medium', checked ? 'text-emerald-700' : 'text-muted-foreground')}>
            {checked ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      )
    }
    if (cfg.dataType === 'INTEGER') {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={effectiveValue}
            onChange={(e) => onDraftChange(cfg.configKey, e.target.value)}
            className="h-8 w-24 text-sm"
          />
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
      )
    }
    return (
      <Input
        value={effectiveValue}
        onChange={(e) => onDraftChange(cfg.configKey, e.target.value)}
        className="h-8 text-sm max-w-xs"
      />
    )
  }

  return (
    <div className={cn('px-5 py-4 border-b border-border last:border-0 transition-colors', isDirty && 'bg-amber-50/50')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold leading-tight">{label}</span>
            {!cfg.active && (
              <span className="text-[10px] font-semibold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Inactive</span>
            )}
            {isDirty && (
              <span className="text-[10px] font-semibold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <AlertCircle size={9} /> Unsaved
              </span>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">{description}</p>}
          <div className="flex items-center gap-1 mt-1">
            <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{cfg.configKey}</code>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {renderInput()}
          {isDirty && (
            <>
              <Button size="sm" onClick={() => onSave(cfg.configKey)} disabled={isSaving} className="h-7 px-3">
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onReset(cfg.configKey)} className="h-7 w-7 p-0">
                <RotateCcw size={12} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SystemConfigPage() {
  const { data, isLoading, isError, refetch } = useListSystemConfigQuery()
  const [updateConfig, { isLoading: isSaving }] = useUpdateSystemConfigMutation()
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const configs = data?.data ?? []

  const categories = useMemo(() => {
    return Array.from(new Set(configs.map((cfg) => cfg.category))).sort()
  }, [configs])

  const filtered = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    return configs.filter((cfg) => {
      const categoryMatches = categoryFilter === 'ALL' || cfg.category === categoryFilter
      const meta = CONFIG_METADATA[cfg.configKey]
      const searchMatches =
        normalized.length === 0 ||
        cfg.configKey.toLowerCase().includes(normalized) ||
        cfg.configValue.toLowerCase().includes(normalized) ||
        (cfg.description ?? '').toLowerCase().includes(normalized) ||
        (meta?.label ?? '').toLowerCase().includes(normalized) ||
        (meta?.description ?? '').toLowerCase().includes(normalized)
      return categoryMatches && searchMatches
    })
  }, [categoryFilter, configs, searchTerm])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {}
    for (const cfg of filtered) {
      if (!groups[cfg.category]) groups[cfg.category] = []
      groups[cfg.category].push(cfg)
    }
    return groups
  }, [filtered])

  const dirtyCount = Object.keys(editValues).length

  const handleDraftChange = (key: string, value: string) => {
    setEditValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (key: string) => {
    const value = editValues[key]
    if (value === undefined) return
    try {
      await updateConfig({ key, body: { configValue: value } }).unwrap()
      setEditValues(prev => { const next = { ...prev }; delete next[key]; return next })
      toast.success(`"${CONFIG_METADATA[key]?.label ?? key}" updated successfully`)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to update configuration'))
    }
  }

  const handleReset = (key: string) => {
    setEditValues((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  if (isError) return <EmptyState title="Failed to load system config" action={{ label: 'Retry', onClick: refetch }} />

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings size={20} className="text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">System Configuration</h1>
          {dirtyCount > 0 && (
            <span className="ml-auto text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
              {dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Platform-wide configuration. Changes take effect immediately. All edits are auditable.
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : configs.length === 0 ? (
        <EmptyState title="No configuration entries found" />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                placeholder="Search settings by name or description…"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_META[cat]?.label ?? cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Config groups */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => {
              const catMeta = CATEGORY_META[category]
              return (
                <div key={category} className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
                    <span className={cn(catMeta?.color ?? 'text-muted-foreground')}>{catMeta?.icon}</span>
                    <h2 className="text-sm font-semibold">{catMeta?.label ?? category}</h2>
                    <span className="ml-auto text-xs text-muted-foreground">{items.length} setting{items.length > 1 ? 's' : ''}</span>
                  </div>
                  {/* Items */}
                  <div>
                    {items.map((cfg) => (
                      <ConfigRow
                        key={cfg.id}
                        cfg={cfg}
                        draftValue={editValues[cfg.configKey]}
                        onDraftChange={handleDraftChange}
                        onSave={handleSave}
                        onReset={handleReset}
                        isSaving={isSaving}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
