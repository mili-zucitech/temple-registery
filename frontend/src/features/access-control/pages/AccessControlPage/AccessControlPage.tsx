import { useState } from 'react'
import { Lock, Users } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RoleVisibilityPanel } from '../../components/RoleVisibilityPanel'
import { REGISTRY_ROLE_TABS } from '../../constants/uiVisibilityRegistry'

export function AccessControlPage() {
  const [activeRole, setActiveRole] = useState(REGISTRY_ROLE_TABS[0].role)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Lock size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">UI Visibility Control</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Control which sidebar items, pages, tabs, and KPI cards are visible for each role.
            Changes take effect immediately — no page reload required.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200/60 bg-blue-50/50 px-4 py-3">
        <Users size={16} className="mt-0.5 flex-shrink-0 text-blue-600" />
        <p className="text-xs leading-relaxed text-blue-800">
          <span className="font-semibold">How this works:</span> Each toggle controls whether a UI element is
          visible to the selected role. Hiding an item removes it from the sidebar and prevents the page from
          rendering — it does not affect data access. SUPER_ADMIN is always exempt and can see everything.
        </p>
      </div>

      {/* Role tabs + panel */}
      <Tabs value={activeRole} onValueChange={setActiveRole}>
        <TabsList className="flex h-auto flex-wrap gap-1 rounded-xl bg-muted/60 p-1">
          {REGISTRY_ROLE_TABS.map(({ role, label }) => (
            <TabsTrigger
              key={role}
              value={role}
              className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {REGISTRY_ROLE_TABS.map(({ role }) => (
          <TabsContent key={role} value={role} className="mt-4">
            <RoleVisibilityPanel role={role} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
