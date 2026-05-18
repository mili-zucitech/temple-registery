import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import ReactSelect from 'react-select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { USER_ROLES, type UserRole } from '@/constants/roles'
import { useListAllDistrictsQuery, useSearchTemplesQuery } from '../../adminApi'
import { useGetCitiesQuery } from '@/features/geo/geoApi'
import type { UserAdminResponse, CreateUserRequest, TempleOption } from '../../adminApi'

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
  cityId: z.string().optional(),
  districtId: z.string().min(1, 'District is required'),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Must be 12 digits').optional().or(z.literal('')),
  // TA: new temple
  templeName: z.string().max(255).optional(),
  // TA: existing temple — stored as string because RHF works with strings for now
  existingTempleId: z.string().optional(),
  // TA: designation and access type
  designation: z.string().max(150).optional().or(z.literal('')),
  accessType: z.enum(['VIEW', 'EDIT']).default('EDIT'),
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
  /** Toggle: true = create new temple, false = assign existing */
  const [createTemple, setCreateTemple] = useState(true)
  /** Debounced search input for the existing-temple react-select dropdown */
  const [templeSearchInput, setTempleSearchInput] = useState('')
  const [templeSearchDebounced, setTempleSearchDebounced] = useState('')
  /** The full TempleOption for the currently selected existing temple (for auto-fill) */
  const [selectedTempleOption, setSelectedTempleOption] = useState<{ value: number; label: string; subLabel: string; districtId?: number; cityId?: number } | null>(null)

  // Debounce temple search by 300 ms
  useEffect(() => {
    const t = setTimeout(() => setTempleSearchDebounced(templeSearchInput), 300)
    return () => clearTimeout(t)
  }, [templeSearchInput])

  const { data: districtsData, isLoading: loadingDistricts } = useListAllDistrictsQuery()
  const { data: citiesData, isLoading: loadingCities } = useGetCitiesQuery(1) // Karnataka stateId=1
  const districts = districtsData?.data ?? []
  const cities = citiesData?.data ?? []

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: buildDefaults(user),
  })

  const watchedRoleValue = form.watch('role')
  const watchedCityId = form.watch('cityId')
  const isTempleAuthority = watchedRoleValue === USER_ROLES.TEMPLE_AUTHORITY
  const showGeoCity = ([USER_ROLES.TEMPLE_AUTHORITY, USER_ROLES.DISTRICT_COLLECTOR, USER_ROLES.DC_STAFF] as UserRole[]).includes(watchedRoleValue as UserRole)

  // Temple dropdown search query (only fires when TA and toggle is OFF)
  const skipTempleSearch = !isTempleAuthority || createTemple
  const { data: templeSearchData, isLoading: loadingTemples } = useSearchTemplesQuery(
    { q: templeSearchDebounced, page: 0, size: 20 },
    { skip: skipTempleSearch },
  )
  const templeOptions: Array<{ value: number; label: string; subLabel: string; districtId?: number; cityId?: number }> =
    (templeSearchData?.data?.content ?? []).map((t: TempleOption) => ({
      value: t.id,
      label: t.name,
      subLabel: `${t.registrationNumber} · ${t.districtName ?? ''}${t.grade ? ` · Grade ${t.grade}` : ''}`,
      districtId: t.districtId,
      cityId: t.cityId,
    }))

  // Filter districts by selected city when city is chosen
  const filteredDistricts = (() => {
    let base = districts
    if (watchedCityId) {
      const cityIdNum = Number(watchedCityId)
      base = base.filter(d => (d as any).cityId === cityIdNum)
    }
    if (districtSearch.trim()) {
      base = base.filter(d => d.name.toLowerCase().includes(districtSearch.toLowerCase()))
    }
    return base
  })()

  // Reset form whenever the dialog opens or the target user changes
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(user))
      setDistrictSearch('')
      setCreateTemple(true)
      setTempleSearchInput('')
      setTempleSearchDebounced('')
      setSelectedTempleOption(null)
    }
  }, [open, user])

  // Clear TA-only fields when role changes away from TA
  useEffect(() => {
    if (!isTempleAuthority) {
      form.setValue('templeName', '')
      form.setValue('aadhaarNumber', '')
      form.setValue('existingTempleId', '')
      form.setValue('designation', '')
    }
  }, [isTempleAuthority])

  // Auto-fill district and city from selected existing temple (Case 2)
  useEffect(() => {
    if (!createTemple && selectedTempleOption) {
      if (selectedTempleOption.districtId != null) {
        form.setValue('districtId', String(selectedTempleOption.districtId))
      }
      if (selectedTempleOption.cityId != null) {
        form.setValue('cityId', String(selectedTempleOption.cityId))
      }
    }
  }, [selectedTempleOption, createTemple])

  // Clear districtId when city changes
  useEffect(() => {
    form.setValue('districtId', '')
  }, [watchedCityId])

  const handleSubmit = async (values: UserFormValues) => {
    if (isTempleAuthority && createTemple && (!values.templeName || values.templeName.trim() === '')) {
      form.setError('templeName', { message: 'Temple name is required' })
      return
    }
    if (isTempleAuthority && !createTemple && !values.existingTempleId) {
      form.setError('existingTempleId', { message: 'Please select an existing temple' })
      return
    }

    await onSubmit({
      username: values.username,
      email: values.email,
      password: values.password || '',
      fullName: values.fullName,
      mobile: values.mobile || undefined,
      role: values.role,
      districtId: Number(values.districtId),
      cityId: values.cityId ? Number(values.cityId) : undefined,
      aadhaarNumber: isTempleAuthority && values.aadhaarNumber ? values.aadhaarNumber : undefined,
      createTemple: isTempleAuthority ? createTemple : undefined,
      templeName: isTempleAuthority && createTemple ? values.templeName : undefined,
      existingTempleId: isTempleAuthority && !createTemple && values.existingTempleId
        ? Number(values.existingTempleId)
        : undefined,
      designation: isTempleAuthority && values.designation ? values.designation : undefined,
      accessType: isTempleAuthority ? (values.accessType ?? 'EDIT') : undefined,
    })
  }

  const selectedDistrictName = districts.find(d => String(d.id) === form.watch('districtId'))?.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[92vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle>{isEdit ? `Edit â€” ${user.fullName}` : 'Create New User'}</DialogTitle>
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

              {/* Create Temple toggle — shown immediately after Role when TA is selected */}
              {isTempleAuthority && !isEdit && (
                <div className="flex items-center gap-3 py-1">
                  <Switch
                    id="createTempleToggle"
                    checked={createTemple}
                    onCheckedChange={checked => {
                      setCreateTemple(checked)
                      form.setValue('templeName', '')
                      form.setValue('existingTempleId', '')
                      form.clearErrors('templeName')
                      form.clearErrors('existingTempleId')
                    }}
                  />
                  <Label htmlFor="createTempleToggle" className="cursor-pointer text-sm font-medium">
                    Create Temple Also?
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {createTemple ? 'A new temple will be created' : 'Assign an existing temple'}
                  </span>
                </div>
              )}

              {/* City — shown for TA, DC, DC_STAFF */}
              {showGeoCity && (
                <FormField control={form.control} name="cityId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City / Division <span className="text-xs text-muted-foreground font-normal">(Optional)</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCities ? 'Loading...' : 'Select city'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-64">
                        {cities.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {/* District */}
              <FormField control={form.control} name="districtId" render={({ field }) => {
                const lockedByTemple = isTempleAuthority && !createTemple && !!selectedTempleOption?.districtId
                return (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select
                      onValueChange={(val) => { field.onChange(val); setDistrictSearch('') }}
                      value={field.value}
                      disabled={lockedByTemple}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingDistricts ? 'Loading...' : selectedDistrictName ?? 'Select district'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-64">
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
                    {lockedByTemple && (
                      <p className="text-xs text-muted-foreground">Auto-filled from selected temple</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )
              }} />

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

              {/* Password â€” create only */}
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
              {isTempleAuthority && !isEdit && (
                <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                  {/* Aadhaar */}
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

                  {/* Case 1: New temple name */}
                  {createTemple && (
                    <FormField control={form.control} name="templeName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temple Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Sri Chamundeshwari Temple" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}

                  {/* Case 2: Assign existing temple via react-select */}
                  {!createTemple && (
                    <FormField control={form.control} name="existingTempleId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Existing Temple</FormLabel>
                        <ReactSelect
                          inputId="templeSelect"                          placeholder="Search by name, registration no., or district..."
                          isLoading={loadingTemples}
                          options={templeOptions}
                          value={selectedTempleOption ?? null}
                          onInputChange={(val) => setTempleSearchInput(val)}
                          onChange={(selected) => {
                            if (selected) {
                              field.onChange(String(selected.value))
                              setSelectedTempleOption(selected)
                            } else {
                              field.onChange('')
                              setSelectedTempleOption(null)
                            }
                          }}
                          filterOption={() => true} // server-side filtering only
                          noOptionsMessage={({ inputValue }) =>
                            inputValue.length === 0
                              ? 'Type to search temples'
                              : 'No temples found'
                          }
                          formatOptionLabel={(opt) => (
                            <div>
                              <div className="font-medium text-sm">{opt.label}</div>
                              <div className="text-xs text-muted-foreground">{opt.subLabel}</div>
                            </div>
                          )}
                          classNames={{
                            control: (state) =>
                              `!min-h-9 !rounded-md !border !border-input !bg-background !text-sm !shadow-sm ${state.isFocused ? '!ring-2 !ring-ring !ring-offset-2' : ''}`,
                            placeholder: () => '!text-muted-foreground !text-sm',
                            menu: () => '!z-50 !rounded-md !border !bg-popover !shadow-md',
                            option: (state) =>
                              `!cursor-pointer !px-3 !py-2 !text-sm ${state.isSelected ? '!bg-primary !text-primary-foreground' : state.isFocused ? '!bg-accent !text-accent-foreground' : '!bg-popover'}`,
                            input: () => '!text-sm',
                          }}
                          unstyled
                        />
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              )}

              {/* TA-only: Designation + Access Type (shown in both create and edit) */}
              {isTempleAuthority && (
                <>
                  <FormField control={form.control} name="designation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation <span className="text-xs text-muted-foreground font-normal">(Optional)</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Trust Secretary, Archaka, Trustee" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="accessType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? 'EDIT'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EDIT">
                            <div>
                              <div className="font-medium">Edit</div>
                              <div className="text-xs text-muted-foreground">Can create drafts, submit for review, and upload documents</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="VIEW">
                            <div>
                              <div className="font-medium">View Only</div>
                              <div className="text-xs text-muted-foreground">Can log in and view temple data but cannot make changes</div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
    cityId: user?.cityId != null ? String(user.cityId) : '',
    districtId: user?.districtId != null ? String(user.districtId) : '',
    templeName: '',
    aadhaarNumber: user?.aadhaarNumber ?? '',
    existingTempleId: '',
    designation: user?.designation ?? '',
    accessType: (user?.accessType as 'VIEW' | 'EDIT') ?? 'EDIT',
  }
}
