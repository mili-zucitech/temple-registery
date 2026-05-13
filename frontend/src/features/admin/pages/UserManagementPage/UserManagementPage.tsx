import { useState } from 'react'
import { toast } from 'sonner'
import {
  useListUsersQuery, useDeactivateUserMutation, useActivateUserMutation,
  useCreateUserMutation, useUpdateUserMutation,
  type UserAdminResponse,
} from '../../adminApi'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Users, Plus, Pencil, Building2, MapPin } from 'lucide-react'
import { UserFormDialog } from '../../components/UserFormDialog/UserFormDialog'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog'
import { USER_ROLES, type UserRole } from '@/constants/roles'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ALL: 'All Users',
  SUPER_ADMIN: 'Super Admin',
  DISTRICT_COLLECTOR: 'District Collector',
  DC_STAFF: 'DC Staff',
  TEMPLE_AUTHORITY: 'Temple Authority',
  AUDITOR: 'Auditor',
  VIEWER: 'Viewer',
}

const ROLE_SHORT: Record<string, string> = {
  ALL: 'All',
  SUPER_ADMIN: 'Super Admin',
  DISTRICT_COLLECTOR: 'DC',
  DC_STAFF: 'DC Staff',
  TEMPLE_AUTHORITY: 'Temple Auth.',
  AUDITOR: 'Auditor',
  VIEWER: 'Viewer',
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  DISTRICT_COLLECTOR: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  DC_STAFF: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
  TEMPLE_AUTHORITY: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  AUDITOR: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  VIEWER: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

// Roles that need a district column
const DISTRICT_ROLES = new Set([USER_ROLES.DISTRICT_COLLECTOR, USER_ROLES.DC_STAFF, USER_ROLES.TEMPLE_AUTHORITY])
// Roles that also need a temple column
const TEMPLE_ROLES = new Set([USER_ROLES.TEMPLE_AUTHORITY])

function maskAadhaar(n?: string): string {
  if (!n) return '—'
  if (n.length === 12) return `xxxx-xxxx-${n.slice(8)}`
  return n
}

function formatDate(dt?: string): string {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Avatar initials ──────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0 ring-1 ring-primary/20">
      {initials}
    </span>
  )
}

// ─── Status filter pills ──────────────────────────────────────────────────────

function StatusFilterBar({
  value, onChange, counts,
}: {
  value: StatusFilter
  onChange: (v: StatusFilter) => void
  counts: Record<StatusFilter, number>
}) {
  const pills: { key: StatusFilter; label: string; dotClass: string }[] = [
    { key: 'ALL', label: 'All', dotClass: '' },
    { key: 'ACTIVE', label: 'Active', dotClass: 'bg-emerald-500' },
    { key: 'INACTIVE', label: 'Inactive', dotClass: 'bg-rose-400' },
  ]
  return (
    <div className="flex items-center gap-1.5">
      {pills.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
            value === p.key
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground',
          )}
        >
          {p.dotClass && (
            <span className={cn('w-1.5 h-1.5 rounded-full', p.dotClass)} />
          )}
          {p.label}
          <span className={cn(
            'ml-0.5 min-w-[18px] text-center rounded-full px-1 text-[10px] font-semibold',
            value === p.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}>
            {counts[p.key]}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Users table ──────────────────────────────────────────────────────────────

interface UsersTableProps {
  users: UserAdminResponse[]
  role: UserRole | 'ALL'
  onEdit: (u: UserAdminResponse) => void
  onToggleStatus: (u: UserAdminResponse) => void
  deactivating: boolean
  activating: boolean
}

function UsersTable({ users, role, onEdit, onToggleStatus, deactivating, activating }: UsersTableProps) {
  const showDistrict = role === 'ALL' || DISTRICT_ROLES.has(role as 'DISTRICT_COLLECTOR' | 'DC_STAFF' | 'TEMPLE_AUTHORITY')
  const showTemple = role === 'ALL' || TEMPLE_ROLES.has(role as 'TEMPLE_AUTHORITY')

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-muted-foreground">
        <div className="p-4 rounded-full bg-muted/60">
          <Users size={28} className="opacity-40" />
        </div>
        <p className="text-sm font-medium">No users found</p>
        <p className="text-xs opacity-70">Try adjusting the filters above</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
            {role === 'ALL' && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
            )}
            {showDistrict && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">District</th>
            )}
            {showTemple && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Temple</th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aadhaar</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Login</th>
            <th className="px-4 py-3 w-[120px]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id} className="group hover:bg-muted/30 transition-colors duration-100">
              {/* User */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={user.fullName} />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </td>

              {/* Role — only on All tab */}
              {role === 'ALL' && (
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={cn('text-[11px] font-medium border', ROLE_COLORS[user.role] ?? '')}
                  >
                    {ROLE_SHORT[user.role] ?? user.role}
                  </Badge>
                </td>
              )}

              {/* District */}
              {showDistrict && (
                <td className="px-4 py-3">
                  {user.districtName ? (
                    <span className="inline-flex items-center gap-1 text-xs text-foreground">
                      <MapPin size={11} className="text-muted-foreground shrink-0" />
                      {user.districtName}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </td>
              )}

              {/* Temple */}
              {showTemple && (
                <td className="px-4 py-3">
                  {user.templeName ? (
                    <span className="inline-flex items-center gap-1 text-xs text-foreground">
                      <Building2 size={11} className="text-muted-foreground shrink-0" />
                      <span className="max-w-[160px] truncate">{user.templeName}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </td>
              )}

              {/* Status */}
              <td className="px-4 py-3">
                <StatusBadge status={user.active ? 'ACTIVE' : 'INACTIVE'} />
              </td>

              {/* Aadhaar */}
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {maskAadhaar(user.aadhaarNumber)}
                </span>
              </td>

              {/* Last Login */}
              <td className="px-4 py-3">
                {user.lastLoginAt ? (
                  <span className="text-xs text-muted-foreground">{formatDate(user.lastLoginAt)}</span>
                ) : (
                  <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">Never</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(user)}
                    title="Edit user"
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant={user.active ? 'destructive' : 'outline'}
                    size="sm"
                    className="h-7 text-xs px-2.5"
                    onClick={() => onToggleStatus(user)}
                    disabled={deactivating || activating}
                  >
                    {user.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Per-role tab content ──────────────────────────────────────────────────────

function RoleTabContent({
  allUsers, role, onEdit, onToggleStatus, deactivating, activating,
}: {
  allUsers: UserAdminResponse[]
  role: UserRole | 'ALL'
  onEdit: (u: UserAdminResponse) => void
  onToggleStatus: (u: UserAdminResponse) => void
  deactivating: boolean
  activating: boolean
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const byRole = role === 'ALL' ? allUsers : allUsers.filter(u => u.role === role)
  const filtered = statusFilter === 'ALL'
    ? byRole
    : byRole.filter(u => statusFilter === 'ACTIVE' ? u.active : !u.active)

  const counts: Record<StatusFilter, number> = {
    ALL: byRole.length,
    ACTIVE: byRole.filter(u => u.active).length,
    INACTIVE: byRole.filter(u => !u.active).length,
  }

  return (
    <div className="space-y-3 pt-4">
      <StatusFilterBar value={statusFilter} onChange={setStatusFilter} counts={counts} />
      <UsersTable
        users={filtered}
        role={role}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
        deactivating={deactivating}
        activating={activating}
      />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function UserManagementPage() {
  const { data, isLoading, isError, refetch } = useListUsersQuery({ page: 0, size: 500 })
  const [deactivate, { isLoading: deactivating }] = useDeactivateUserMutation()
  const [activate, { isLoading: activating }] = useActivateUserMutation()
  const [createUser, { isLoading: creating }] = useCreateUserMutation()
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserAdminResponse | null>(null)
  const [confirmStatusUser, setConfirmStatusUser] = useState<UserAdminResponse | null>(null)

  const allUsers = data?.data?.content ?? []

  const handleCreate = () => { setSelectedUser(null); setDialogOpen(true) }
  const handleEdit = (user: UserAdminResponse) => { setSelectedUser(user); setDialogOpen(true) }
  const handleToggleStatus = (user: UserAdminResponse) => setConfirmStatusUser(user)

  const toggleUserStatus = async (user: UserAdminResponse) => {
    try {
      if (user.active) {
        await deactivate(user.id).unwrap()
        toast.success(`${user.fullName} deactivated`)
      } else {
        await activate(user.id).unwrap()
        toast.success(`${user.fullName} activated`)
      }
    } catch {
      toast.error('Failed to update user status')
    } finally {
      setConfirmStatusUser(null)
    }
  }

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedUser) {
        await updateUser({ id: selectedUser.id, body: values }).unwrap()
        toast.success('User updated successfully')
      } else {
        await createUser(values).unwrap()
        toast.success('User created successfully')
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to save user')
    }
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load users"
        description="Unable to fetch user data."
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    )
  }

  const tabProps = { allUsers, onEdit: handleEdit, onToggleStatus: handleToggleStatus, deactivating, activating }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLoading ? 'Loading...' : `${allUsers.length} user${allUsers.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="gap-1.5 h-8 text-sm">
          <Plus size={14} />
          Create User
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <Tabs defaultValue="ALL" className="w-full">
          <div className="border-b border-border">
            <TabsList className="h-auto bg-transparent p-0 gap-0 flex flex-wrap">
              {/* All tab */}
              <TabsTrigger
                value="ALL"
                className="relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all
                  data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent
                  hover:text-foreground hover:bg-muted/40"
              >
                All
                <span className="ml-1.5 text-[11px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-normal">
                  {allUsers.length}
                </span>
              </TabsTrigger>

              {/* Role tabs */}
              {Object.values(USER_ROLES).map(role => {
                const count = allUsers.filter(u => u.role === role).length
                return (
                  <TabsTrigger
                    key={role}
                    value={role}
                    className="relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all
                      data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent
                      hover:text-foreground hover:bg-muted/40"
                  >
                    {ROLE_SHORT[role]}
                    <span className="ml-1.5 text-[11px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-normal">
                      {count}
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <TabsContent value="ALL" className="mt-0 outline-none ring-0 focus-visible:ring-0">
            <RoleTabContent role="ALL" {...tabProps} />
          </TabsContent>
          {Object.values(USER_ROLES).map(role => (
            <TabsContent key={role} value={role} className="mt-0 outline-none ring-0 focus-visible:ring-0">
              <RoleTabContent role={role} {...tabProps} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        onSubmit={handleFormSubmit}
        isLoading={creating || updating}
      />

      <ConfirmDialog
        open={confirmStatusUser !== null}
        onOpenChange={(open) => { if (!open) setConfirmStatusUser(null) }}
        title={confirmStatusUser?.active
          ? `Deactivate ${confirmStatusUser?.fullName}?`
          : `Activate ${confirmStatusUser?.fullName}?`}
        description={confirmStatusUser?.active
          ? `${confirmStatusUser?.username} will lose login access immediately.`
          : `Login access will be restored for ${confirmStatusUser?.username}.`}
        confirmLabel={confirmStatusUser?.active ? 'Deactivate' : 'Activate'}
        confirmVariant={confirmStatusUser?.active ? 'destructive' : 'default'}
        onConfirm={() => confirmStatusUser && toggleUserStatus(confirmStatusUser)}
      />
    </div>
  )
}