import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { UserAdminResponse } from '../../adminApi'

interface UserViewModalProps {
  user: UserAdminResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Row({ label, value }: { label: string; value?: string | number | null | boolean }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="text-xs text-muted-foreground w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground break-all">{String(value)}</span>
    </div>
  )
}

export function UserViewModal({ user, open, onOpenChange }: UserViewModalProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 divide-y divide-border">
          <Row label="Full Name" value={user.fullName} />
          <Row label="Username" value={user.username} />
          <Row label="Email" value={user.email} />
          <Row label="Mobile" value={user.mobile} />
          <Row label="Role" value={user.role} />
          <Row label="District" value={user.districtName} />
          <Row label="Temple" value={user.templeName} />
          <Row label="Designation" value={user.designation} />
          <Row label="Access Type" value={user.accessType} />
          <Row label="Aadhaar" value={user.aadhaarNumber ? `XXXX-XXXX-${user.aadhaarNumber.slice(-4)}` : undefined} />
          <div className="flex items-start gap-3 py-2.5">
            <span className="text-xs text-muted-foreground w-36 shrink-0 pt-0.5">Status</span>
            <Badge variant={user.active ? 'default' : 'secondary'} className="text-xs">
              {user.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <Row label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'} />
          <Row label="Created At" value={user.createdAt ? new Date(user.createdAt).toLocaleString() : undefined} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
