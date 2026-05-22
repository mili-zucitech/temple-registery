import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useGetPolicyMatrixQuery, useBatchUpsertPoliciesMutation } from '../accessControlApi'
import type { CreatePolicyRequest } from '../accessControlApi'
import { UI_VISIBILITY_REGISTRY } from '../constants/uiVisibilityRegistry'
import { VisibilitySection } from './VisibilityControls'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'

interface RoleVisibilityPanelProps {
  role: string
}

export function RoleVisibilityPanel({ role }: RoleVisibilityPanelProps) {
  const config = UI_VISIBILITY_REGISTRY[role]
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())

  const { data: matrixData, isLoading, isError, refetch } = useGetPolicyMatrixQuery()
  const [batchUpsert] = useBatchUpsertPoliciesMutation()

  // Derive which keys are currently enabled for this role from the policy matrix.
  // Fail-open: no policy = visible (true), only DENY = hidden (false)
  const enabledKeys = useMemo<Set<string>>(() => {
    const matrix = matrixData?.data?.matrix ?? {}
    const allItems = config?.sections.flatMap((s) => s.items) ?? []
    const enabled = new Set<string>()

    for (const item of allItems) {
      const effect = matrix[item.key]?.[role]
      if (effect !== 'DENY') {
        enabled.add(item.key)
      }
    }
    return enabled
  }, [matrixData, role, config])

  const handleToggle = useCallback(
    async (key: string, targetType: string, nowEnabled: boolean) => {
      setSavingKeys((prev) => new Set([...prev, key]))

      const payload: CreatePolicyRequest = {
        targetType: targetType as CreatePolicyRequest['targetType'],
        targetKey: key,
        subjectType: 'ROLE',
        subjectValue: role,
        effect: nowEnabled ? 'ALLOW' : 'DENY',
        active: true,
        conditions: null,
      }

      try {
        await batchUpsert([payload]).unwrap()
      } catch {
        toast.error('Failed to save change. Please try again.')
      } finally {
        setSavingKeys((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    },
    [batchUpsert, role],
  )

  if (!config) {
    return (
      <div className="py-12">
        <EmptyState title="No configuration found" description="No visibility items are defined for this role." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-12">
        <EmptyState
          title="Failed to load permissions"
          description="Could not fetch current visibility state."
          action={{ label: 'Retry', onClick: refetch }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {config.sections.map((section, idx) => (
        <VisibilitySection
          key={section.id}
          title={section.title}
          items={section.items}
          enabledKeys={enabledKeys}
          savingKeys={savingKeys}
          onToggle={handleToggle}
          defaultOpen={idx === 0}
        />
      ))}
    </div>
  )
}
