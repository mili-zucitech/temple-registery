import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { USER_ROLES, type UserRole } from '@/constants/roles'
import { useListAllDistrictsQuery } from '../../adminApi'
import type { UserAdminResponse, CreateUserRequest } from '../../adminApi'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  DISTRICT_COLLECTOR: 'District Collector',
  DC_STAFF: 'DC Staff',
  TEMPLE_AUTHORITY: 'Temple Authority',
  AUDITOR: 'Auditor',
  VIEWER: 'Viewer',
}

const userSchema = z.object({
  role: z.enum([
    USER_ROLES.SUPER_ADMIN, USER_ROLES.DISTRICT_COLLECTOR, USER_ROLES.DC_STAFF,
    USER_ROLES.TEMPLE_AUTHORITY, USER_ROLES.AUDITOR, USER_ROLES.VIEWER,
  ] as [UserRole, ...UserRole[]]),
  username: z.string().min(3, 'At least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters').optional().or(z.literal('')),
  fullName: z.string().min(2, 'Full name is required'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile').optional().or(z.literal('')),
  districtId: z.string().min(1, 'District is required'),
  templeName: z.string().max(255).optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Must be 12 digits').optional().or(z.literal('')),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserAdminResponse | null
  onSubmit: (values: CreateUserRequest) => Promise<void>
  isLoading?: boolean
}

export function UserFormDialog({ open, onOpenChange, user, onSubmit, isLoading }: UserFormDialogProps) {
  const isEdit = !!user
  const [districtSearch, setDistrictSearch] = useState('')

  const { data: districtsData, isLoading: loadingDistricts } = useListAllDistrictsQuery()
  const districts = districtsData?.data ?? []

  const filteredDistricts = districtSearch.trim()
    ? districts.filter(d => d.name.toLowerCase().includes(districtSearch.toLowerCase()))
    : districts

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: buildDefaults(user),
  })

  // Reset form whenever the dialog opens or the target user changes
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(user))
      setDistrictSearch('')
    }
  }, [open, user])

  const watchedRole = form.watch('role')
  const isTempleAuthority = watchedRole === USER_ROLES.TEMPLE_AUTHORITY

  useEffect(() => {
    if (!isTempleAuthority) {
      form.setValue('templeName', '')
      form.setValue('aadhaarNumber', '')
    }
  }, [isTempleAuthority])

  const handleSubmit = async (values: UserFormValues) => {
    await onSubmit({
      username: values.username,
      email: values.email,
      password: values.password || '',
      fullName: values.fullName,
      mobile: values.mobile || undefined,
      role: values.role,
      districtId: Number(values.districtId),
      templeName: isTempleAuthority ? values.templeName : undefined,
      aadhaarNumber: isTempleAuthority && values.aadhaarNumber ? values.aadhaarNumber : undefined,
    })
  }

  const selectedDistrictName = districts.find(d => String(d.id) === form.watch('districtId'))?.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[92vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle>{isEdit ? `Edit — ${user.fullName}` : 'Create New User'}</DialogTitle>
          {isEdit && (
            <DialogDescription className="text-xs">
              Username and role are locked after creation.
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Role */}
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEdit}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(USER_ROLES).map(role => (
                        <SelectItem key={role} value={role}>{ROLE_LABELS[role] ?? role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* District — uses native Select (works inside Dialog) */}
              <FormField control={form.control} name="districtId" render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <Select onValueChange={(val) => { field.onChange(val); setDistrictSearch('') }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingDistricts ? 'Loading...' : selectedDistrictName ?? 'Select district'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-64">
                      {/* Inline search filter */}
                      <div className="px-2 py-1.5 border-b">
                        <Input
                          placeholder="Search district..."
                          value={districtSearch}
                          onChange={e => setDistrictSearch(e.target.value)}
                          className="h-7 text-sm"
                          onKeyDown={e => e.stopPropagation()}
                        />
                      </div>
                      {filteredDistricts.length === 0 ? (
                        <div className="py-3 text-center text-sm text-muted-foreground">No districts found</div>
                      ) : (
                        filteredDistricts.map(d => (
                          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Username + Email */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input {...field} disabled={isEdit} placeholder="jdoe" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} type="email" placeholder="john@example.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Password — create only */}
              {!isEdit && (
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input {...field} type="password" placeholder="Min 8 characters" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {/* Full Name */}
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} placeholder="John Doe" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Mobile */}
              <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile <span className="text-xs text-muted-foreground font-normal">(Optional)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="9876543210" inputMode="numeric" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* TA-only fields */}
              {isTempleAuthority && (
                <>
                  <FormField control={form.control} name="aadhaarNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123456789012" inputMode="numeric" maxLength={12}
                          onChange={e => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 12))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="templeName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temple Name</FormLabel>
                      <FormControl><Input {...field} placeholder="Sri Chamundeshwari Temple" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t shrink-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function buildDefaults(user?: UserAdminResponse | null): UserFormValues {
  return {
    role: user?.role ?? USER_ROLES.DISTRICT_COLLECTOR,
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    fullName: user?.fullName ?? '',
    mobile: user?.mobile ?? '',
    districtId: user?.districtId != null ? String(user.districtId) : '',
    templeName: '',
    aadhaarNumber: user?.aadhaarNumber ?? '',
  }
}