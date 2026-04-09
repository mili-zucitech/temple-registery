import { useState } from 'react'
import { toast } from 'sonner'
import {
  useListUsersQuery, useDeactivateUserMutation, useActivateUserMutation,
  type UserAdminResponse
} from '../../adminApi'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Badge } from '@/components/ui/badge'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { Users } from 'lucide-react'

export function UserManagementPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, isError } = useListUsersQuery({ page, size: DEFAULT_PAGE_SIZE })
  const [deactivate, { isLoading: deactivating }] = useDeactivateUserMutation()
  const [activate, { isLoading: activating }] = useActivateUserMutation()

  const users = data?.data?.content ?? []
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
    } catch {
      toast.error('Failed to update user status')
    }
  }

  if (isError) {
    return <EmptyState title="Failed to load users" description="Unable to fetch user data." action={{ label: 'Retry', onClick: () => window.location.reload() }} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{totalElements.toLocaleString()} user(s)</p>
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
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant={user.active ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => toggleUserStatus(user)}
                      disabled={deactivating || activating}
                    >
                      {user.active ? 'Deactivate' : 'Activate'}
                    </Button>
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
    </div>
  )
}
