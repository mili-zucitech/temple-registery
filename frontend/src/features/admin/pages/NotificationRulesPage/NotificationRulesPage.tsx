import { useMemo, useState } from 'react'
import { useListNotificationRulesQuery, useUpdateNotificationRuleMutation } from '../../adminApi'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Bell, Search, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'

export function NotificationRulesPage() {
  const { data, isLoading, isError, refetch } = useListNotificationRulesQuery()
  const [updateRule] = useUpdateNotificationRuleMutation()
  const [saving, setSaving] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const rules = data?.data ?? []

  const grouped = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    const filtered = rules.filter((rule) => {
      if (!normalized) return true
      return (
        rule.eventType.toLowerCase().includes(normalized) ||
        rule.action.toLowerCase().includes(normalized) ||
        rule.channel.toLowerCase().includes(normalized) ||
        rule.recipientType.toLowerCase().includes(normalized)
      )
    })

    return filtered.reduce<Record<string, typeof filtered>>((acc, rule) => {
      const key = `${rule.channel}`
      acc[key] = acc[key] ? [...acc[key], rule] : [rule]
      return acc
    }, {})
  }, [rules, searchTerm])

  const handleToggle = async (id: number, enabled: boolean) => {
    setSaving(id)
    try {
      await updateRule({ id, body: { enabled } }).unwrap()
      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'}.`)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to update rule.'))
    } finally {
      setSaving(null)
    }
  }

  if (isError) return <EmptyState title="Failed to load notification rules" action={{ label: 'Retry', onClick: refetch }} />

  const handleTestNotification = () => {
    toast.info('Notification test queued. Check delivery logs in Admin Tools.')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell size={20} />
        <h1 className="text-2xl font-bold">Notification Rules</h1>
      </div>
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : rules.length === 0 ? (
        <EmptyState title="No notification rules found" />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" placeholder="Search by event, action, recipient, channel" />
              </div>
              <Button variant="outline" onClick={handleTestNotification}>
                <FlaskConical size={14} className="mr-2" /> Test Notification
              </Button>
            </div>
          </div>

          {Object.entries(grouped).map(([channel, channelRules]) => (
            <div key={channel} className="rounded-lg border border-border overflow-hidden bg-card">
              <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Channel: {channel}</h2>
                <Badge variant="secondary">{channelRules.length} rules</Badge>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">Entity</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Recipient</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Enabled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {channelRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{rule.eventType}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{rule.entityType}</Badge></td>
                      <td className="px-4 py-3 text-xs">{rule.action}</td>
                      <td className="px-4 py-3 text-xs">{rule.recipientType}</td>
                      <td className="px-4 py-3 text-xs">{rule.priority}</td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={rule.enabled}
                          disabled={saving === rule.id}
                          onCheckedChange={(v) => handleToggle(rule.id, v)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
