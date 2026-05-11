import { useState } from 'react'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'
import {
  useListUsersQuery, useDeactivateUserMutation, useActivateUserMutation,
  useCreateUserMutation, useUpdateUserMutation,
  type UserAdminResponse
} from '../../adminApi'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Badge } from '@/components/ui/badge'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { Users, Plus, Edit2 } from 'lucide-react'
import { UserFormDialog } from '../../components/UserFormDialog/UserFormDialog'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog'

export function UserManagementPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, refetch } = useListUsersQuery({ page, size: DEFAULT_PAGE_SIZE })
  const [deactivate, { isLoading: deactivating }] = useDeactivateUserMutation()
  const [activate, { isLoading: activating }] = useActivateUserMutation()
  const [createUser, { isLoading: creating }] = useCreateUserMutation()
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserAdminResponse | null>(null)
  const [confirmStatusUser, setConfirmStatusUser] = useState<UserAdminResponse | null>(null)
  const [showInactiveOnly, setShowInactiveOnly] = useState(false)

  const allUsers = data?.data?.content ?? []
  const users = showInactiveOnly ? allUsers.filter((u) => !u.active) : allUsers
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  const toggleUserStatus = async (user: UserAdminResponse) => {
    try {
      if (user.active) {
        await deactivate(user.id).unwrap()
        toast.success(`User ${user.username} deactivated`)
      } else {
        await activate(user.id).unwrap()
        toast.success(`User ${user.username} activated`)
      }
      setConfirmStatusUser(null)
    } catch {
      toast.error('Failed to update user status')
      setConfirmStatusUser(null)
    }
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleEdit = (user: UserAdminResponse) => {
    setSelectedUser(user)
    setDialogOpen(true)
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
    return <EmptyState title="Failed to load users" description="Unable to fetch user data." action={{ label: 'Retry', onClick: () => refetch() }} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">{totalElements.toLocaleString()} user(s)</p>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactiveOnly}
              onChange={(e) => setShowInactiveOnly(e.target.checked)}
              className="rounded border-border"
            />
            Show inactive only
          </label>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={16} /> Create User
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" icon={<Users size={32} />} />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">User</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Aadhaar</th>
                <th className="px-4 py-3 text-left font-semibold">Last Login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={user.aadhaarVerified ? 'text-success text-xs font-medium' : 'text-muted-foreground text-xs'}>
                      {user.aadhaarVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {user.lastLoginAt
                      ? <span className="text-muted-foreground">{new Date(user.lastLoginAt).toLocaleString()}</span>
                      : <span className="text-amber-600 font-medium">Never</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant={user.active ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => setConfirmStatusUser(user)}
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
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>Next</Button>
        </div>
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
        title={confirmStatusUser?.active ? `Deactivate ${confirmStatusUser?.fullName}?` : `Activate ${confirmStatusUser?.fullName}?`}
        description={
          confirmStatusUser?.active
            ? `This will prevent ${confirmStatusUser?.username} from logging in. The action is logged and reversible.`
            : `This will restore login access for ${confirmStatusUser?.username}. The action is logged.`
        }
        confirmLabel={confirmStatusUser?.active ? 'Deactivate' : 'Activate'}
        confirmVariant={confirmStatusUser?.active ? 'destructive' : 'default'}
        onConfirm={() => confirmStatusUser && toggleUserStatus(confirmStatusUser)}
      />
    </div>
  )
}
