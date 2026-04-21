import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useGetTrustByTempleQuery, useCreateTrustMutation, useUpdateTrustMutation,
  useGetBoardMembersQuery, useAddBoardMemberMutation, useDeleteBoardMemberMutation,
  useUpdateBoardMemberMutation,
  useListFinancialsQuery, useSubmitFinancialMutation,
  useListBoardMeetingsQuery, useCreateBoardMeetingMutation, useUploadMeetingMinutesMutation,
} from '@/features/trust/trustApi'
import {
  createTrustSchema, createBoardMemberSchema, updateBoardMemberSchema, submitTrustFinancialSchema, createBoardMeetingSchema,
  TRUST_TYPES,
  type CreateTrustRequest, type CreateBoardMemberRequest, type UpdateBoardMemberRequest, type SubmitTrustFinancialRequest, type CreateBoardMeetingRequest,
} from '@/features/trust/trustTypes'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

const MAX_MINUTES_SIZE = 10 * 1024 * 1024

function formatInr(value?: number | null) {
  if (value == null) return '—'
  return `₹${value.toLocaleString('en-IN')}`
}

function trustReviewStatus(trust: { isVerifiedByDc?: boolean; dcFlagReason?: string | null } | null) {
  if (!trust) return 'PENDING'
  if (trust.isVerifiedByDc) return 'APPROVED'
  if (trust.dcFlagReason) return 'FLAGGED'
  return 'PENDING'
}

export function TaTrustPage() {
  const [tab, setTab] = useState('details')
  const [page, setPage] = useState(0)
  const [showTrustForm, setShowTrustForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
  const [showFinancialForm, setShowFinancialForm] = useState(false)
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [meetingFile, setMeetingFile] = useState<File | null>(null)

  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  const { data: trustData, isLoading: trustLoading } = useGetTrustByTempleQuery(templeId!, { skip: !templeId })
  const trust = useMemo(() => trustData?.data?.[0] ?? null, [trustData])

  const { data: membersData, isLoading: membersLoading } = useGetBoardMembersQuery(
    { trustId: trust?.id! },
    { skip: !trust?.id || tab !== 'board' }
  )
  const { data: financialsData, isLoading: financialsLoading } = useListFinancialsQuery(
    { trustId: trust?.id! },
    { skip: !trust?.id || tab !== 'financials' }
  )
  const { data: meetingsData, isLoading: meetingsLoading } = useListBoardMeetingsQuery(
    { trustId: trust?.id!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !trust?.id || tab !== 'meetings' }
  )

  const [createTrust, { isLoading: creating }] = useCreateTrustMutation()
  const [updateTrust, { isLoading: updating }] = useUpdateTrustMutation()
  const [addMember, { isLoading: addingMember }] = useAddBoardMemberMutation()
  const [updateMember, { isLoading: updatingMember }] = useUpdateBoardMemberMutation()
  const [deleteBoardMember, { isLoading: deletingMember }] = useDeleteBoardMemberMutation()
  const [submitFinancial, { isLoading: submittingFinancial }] = useSubmitFinancialMutation()
  const [createMeeting, { isLoading: creatingMeeting }] = useCreateBoardMeetingMutation()
  const [uploadMeetingMinutes, { isLoading: uploadingMinutes }] = useUploadMeetingMinutesMutation()

  const trustForm = useForm<CreateTrustRequest>({
    resolver: zodResolver(createTrustSchema),
    values: {
      trustName: trust?.trustName ?? '',
      trustType: (trust?.trustType as CreateTrustRequest['trustType']) ?? 'MULTI_TRUSTEE',
      registrationNumber: trust?.registrationNumber ?? '',
      registeringAuthority: trust?.registeringAuthority ?? '',
      dateOfRegistration: trust?.dateOfRegistration ?? '',
      panNumber: '',        // Never pre-fill — raw PAN is not returned by the API
      bankAccountNumber: '', // Never pre-fill — raw account is not returned by the API
      bankName: trust?.bankName ?? '',
      bankBranch: trust?.bankBranch ?? '',
      annualIncome: trust?.annualIncome ?? null,  // null keeps the input controlled (renders as '')
    },
  })

  const memberForm = useForm<CreateBoardMemberRequest>({
    resolver: zodResolver(createBoardMemberSchema),
    defaultValues: {
      fullName: '',
      aadhaarNumber: '',
      designation: '',
      appointmentDate: '',
      tenureEndDate: '',
      contactNumber: '',
      address: '',
    },
  })

  const financialForm = useForm<SubmitTrustFinancialRequest>({
    resolver: zodResolver(submitTrustFinancialSchema),
    defaultValues: { financialYear: '', annualIncome: null, annualExpenditure: null },
  })

  const meetingForm = useForm<CreateBoardMeetingRequest>({
    resolver: zodResolver(createBoardMeetingSchema),
    defaultValues: { meetingDate: '', agenda: '' },
  })

  const onSaveTrust = async (values: CreateTrustRequest) => {
    if (!templeId) return
    try {
      if (trust) {
        await updateTrust({ trustId: trust.id, body: values }).unwrap()
        toast.success('Trust details updated')
      } else {
        await createTrust({ templeId, body: values }).unwrap()
        toast.success('Trust registered successfully')
      }
      setShowTrustForm(false)
    } catch {
      toast.error('Failed to save trust details')
    }
  }

  const updateMemberForm = useForm<UpdateBoardMemberRequest>({
    resolver: zodResolver(updateBoardMemberSchema),
    defaultValues: { fullName: '', designation: '', contactNumber: '', address: '', tenureEndDate: '', isCurrent: undefined },
  })

  const onAddMember = async (values: CreateBoardMemberRequest) => {
    if (!trust?.id) return
    try {
      await addMember({ trustId: trust.id, body: values }).unwrap()
      toast.success('Board member added')
      memberForm.reset()
      setShowMemberForm(false)
    } catch {
      toast.error('Failed to add board member')
    }
  }

  const onSubmitFinancial = async (values: SubmitTrustFinancialRequest) => {
    if (!trust?.id) return
    try {
      await submitFinancial({ trustId: trust.id, body: values }).unwrap()
      toast.success('Financial statement submitted')
      financialForm.reset()
      setShowFinancialForm(false)
    } catch {
      toast.error('Failed to submit financial statement')
    }
  }

  const onCreateMeeting = async (values: CreateBoardMeetingRequest) => {
    if (!trust?.id) return
    if (meetingFile) {
      if (meetingFile.type !== 'application/pdf') {
        toast.error('Meeting minutes must be a PDF')
        return
      }
      if (meetingFile.size > MAX_MINUTES_SIZE) {
        toast.error('Meeting minutes must be 10 MB or smaller')
        return
      }
    }
    try {
      const created = await createMeeting({ trustId: trust.id, body: values }).unwrap()
      if (meetingFile && created.data?.id) {
        const formData = new FormData()
        formData.append('file', meetingFile)
        await uploadMeetingMinutes({ trustId: trust.id, meetingId: created.data.id, body: formData }).unwrap()
      }
      toast.success('Board meeting recorded')
      meetingForm.reset()
      setMeetingFile(null)
      setShowMeetingForm(false)
    } catch {
      toast.error('Failed to record board meeting')
    }
  }

  const onDeleteMember = async (memberId: number) => {
    if (!trust?.id) return
    try {
      await deleteBoardMember({ trustId: trust.id, memberId }).unwrap()
      toast.success('Board member removed')
    } catch {
      toast.error('Failed to remove board member')
    }
  }

  const onUpdateMember = async (values: UpdateBoardMemberRequest) => {
    if (!trust?.id || editingMemberId == null) return
    try {
      await updateMember({ trustId: trust.id, memberId: editingMemberId, body: values }).unwrap()
      toast.success('Board member updated')
      updateMemberForm.reset()
      setEditingMemberId(null)
    } catch {
      toast.error('Failed to update board member')
    }
  }

  const reviewStatus = trustReviewStatus(trust)
  const currentMembers = membersData?.data?.current ?? []
  const pastMembers = membersData?.data?.past ?? []
  const financials = financialsData?.data ?? []
  const meetings = meetingsData?.data?.content ?? []

  if (trustLoading) {
    return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trust Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage trust details, board members, meetings, and annual financials.</p>
        </div>
        {!trust && (
          <Button className="bg-gradient-gold shadow-gold" onClick={() => setShowTrustForm(true)}>
            Register Trust
          </Button>
        )}
      </div>

      {!trust && !showTrustForm ? (
        <EmptyState
          title="Trust not registered"
          description="Register your temple trust before submitting board, meeting, and financial details."
          action={{ label: 'Register Trust', onClick: () => setShowTrustForm(true) }}
        />
      ) : (
        <Tabs value={tab} onValueChange={(value) => { setTab(value); setPage(0) }}>
          <TabsList>
            <TabsTrigger value="details">Trust Details</TabsTrigger>
            <TabsTrigger value="board" disabled={!trust}>Board Members</TabsTrigger>
            <TabsTrigger value="meetings" disabled={!trust}>Meetings</TabsTrigger>
            <TabsTrigger value="financials" disabled={!trust}>Financials</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            {showTrustForm || !trust ? (
              <Form {...trustForm}>
                <form onSubmit={trustForm.handleSubmit(onSaveTrust)} className="space-y-4 rounded-lg border border-border bg-card p-6">
                  <h2 className="font-semibold text-foreground">{trust ? 'Edit Trust Details' : 'Register Trust'}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={trustForm.control} name="trustName" render={({ field }) => (
                      <FormItem><FormLabel>Trust Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control} name="trustType" render={({ field }) => (
                      <FormItem><FormLabel>Trust Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {TRUST_TYPES.map((type) => <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={trustForm.control} name="registrationNumber" render={({ field }) => (
                      <FormItem><FormLabel>Registration Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control} name="dateOfRegistration" render={({ field }) => (
                      <FormItem><FormLabel>Date of Registration *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control} name="registeringAuthority" render={({ field }) => (
                      <FormItem><FormLabel>Registering Authority *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control} name="panNumber" render={({ field }) => (
                      <FormItem><FormLabel>PAN Number *</FormLabel><FormControl><Input {...field} className="uppercase" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control} name="bankAccountNumber" render={({ field }) => (
                      <FormItem><FormLabel>Bank Account Number *</FormLabel><FormControl><Input inputMode="numeric" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control} name="bankName" render={({ field }) => (
                      <FormItem><FormLabel>Bank Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control} name="bankBranch" render={({ field }) => (
                      <FormItem><FormLabel>Bank Branch *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control} name="annualIncome" render={({ field }) => (
                      <FormItem><FormLabel>Annual Income</FormLabel><FormControl><Input type="number" min={0} step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="bg-gradient-gold shadow-gold" disabled={creating || updating}>
                      {(creating || updating) ? 'Saving...' : trust ? 'Update Trust' : 'Register Trust'}
                    </Button>
                    {trust && <Button type="button" variant="outline" onClick={() => setShowTrustForm(false)}>Cancel</Button>}
                  </div>
                </form>
              </Form>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">{trust.trustName}</h2>
                    <p className="text-xs text-muted-foreground mt-1">DC review status</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={reviewStatus} />
                    <Button variant="outline" size="sm" onClick={() => setShowTrustForm(true)}>Edit</Button>
                  </div>
                </div>
                {trust.dcFlagReason && (
                  <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    DC feedback: {trust.dcFlagReason}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{trust.trustType?.replace(/_/g, ' ')}</span></div>
                  <div><span className="text-muted-foreground">Reg. No:</span> <span className="font-medium">{trust.registrationNumber}</span></div>
                  <div><span className="text-muted-foreground">Authority:</span> <span className="font-medium">{trust.registeringAuthority}</span></div>
                  <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{trust.dateOfRegistration}</span></div>
                  <div><span className="text-muted-foreground">PAN:</span> <span className="font-medium">{trust.maskedPanNumber ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Bank Account:</span> <span className="font-medium">{trust.maskedBankAccountNumber ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{trust.bankName ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Branch:</span> <span className="font-medium">{trust.bankBranch ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Annual Income:</span> <span className="font-medium">{formatInr(trust.annualIncome)}</span></div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="board" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-foreground">Board Members</h2>
              <Button size="sm" onClick={() => { setShowMemberForm(true); setEditingMemberId(null) }}>+ Add Member</Button>
            </div>
            {showMemberForm && (
              <Form {...memberForm}>
                <form onSubmit={memberForm.handleSubmit(onAddMember)} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={memberForm.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="aadhaarNumber" render={({ field }) => (
                      <FormItem><FormLabel>Aadhaar *</FormLabel><FormControl><Input inputMode="numeric" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="designation" render={({ field }) => (
                      <FormItem><FormLabel>Designation *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="appointmentDate" render={({ field }) => (
                      <FormItem><FormLabel>Appointment Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="tenureEndDate" render={({ field }) => (
                      <FormItem><FormLabel>Tenure End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="contactNumber" render={({ field }) => (
                      <FormItem><FormLabel>Contact Number *</FormLabel><FormControl><Input inputMode="tel" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={memberForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address *</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={addingMember}>{addingMember ? 'Adding...' : 'Add Member'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMemberForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {editingMemberId != null && (
              <Form {...updateMemberForm}>
                <form onSubmit={updateMemberForm.handleSubmit(onUpdateMember)} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Edit Member</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={updateMemberForm.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={updateMemberForm.control} name="designation" render={({ field }) => (
                      <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={updateMemberForm.control} name="contactNumber" render={({ field }) => (
                      <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input inputMode="tel" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={updateMemberForm.control} name="tenureEndDate" render={({ field }) => (
                      <FormItem><FormLabel>Tenure End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={updateMemberForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={updatingMember}>{updatingMember ? 'Saving...' : 'Save Changes'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingMemberId(null)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {membersLoading ? <CardSkeleton /> : (
              <div className="grid gap-4 lg:grid-cols-2">
                <MemberSection title={`Current Members (${currentMembers.length})`} members={currentMembers} onDelete={onDeleteMember} onEdit={(id) => setEditingMemberId(id)} deleting={deletingMember} />
                <MemberSection title={`Past Members (${pastMembers.length})`} members={pastMembers} onDelete={onDeleteMember} onEdit={(id) => setEditingMemberId(id)} deleting={deletingMember} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="meetings" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-foreground">Board Meetings</h2>
              <Button size="sm" onClick={() => setShowMeetingForm(true)}>+ Record Meeting</Button>
            </div>
            {showMeetingForm && (
              <Form {...meetingForm}>
                <form onSubmit={meetingForm.handleSubmit(onCreateMeeting)} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={meetingForm.control} name="meetingDate" render={({ field }) => (
                      <FormItem><FormLabel>Meeting Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={meetingForm.control} name="agenda" render={({ field }) => (
                      <FormItem><FormLabel>Agenda</FormLabel><FormControl><Input placeholder="Agenda summary" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting Minutes PDF</label>
                    <Input type="file" accept="application/pdf" onChange={(e) => setMeetingFile(e.target.files?.[0] ?? null)} />
                    <p className="text-xs text-muted-foreground">PDF only, maximum 10 MB.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={creatingMeeting || uploadingMinutes}>{(creatingMeeting || uploadingMinutes) ? 'Saving...' : 'Record Meeting'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMeetingForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {meetingsLoading ? <CardSkeleton /> : (
              meetings.length === 0 ? (
                <EmptyState title="No meetings recorded" description="Record meetings and attach minutes for governance review." />
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="rounded-lg border border-border bg-card p-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">{new Date(meeting.meetingDate).toLocaleDateString('en-IN')}</p>
                        {meeting.agenda && <p className="text-sm text-muted-foreground mt-1">{meeting.agenda}</p>}
                      </div>
                      <StatusBadge status={meeting.minutesDocumentId ? 'SUBMITTED' : 'PENDING'} />
                    </div>
                  ))}
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="financials" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-foreground">Financial Statements</h2>
              <Button size="sm" onClick={() => setShowFinancialForm(true)}>+ Submit Statement</Button>
            </div>
            {showFinancialForm && (
              <Form {...financialForm}>
                <form onSubmit={financialForm.handleSubmit(onSubmitFinancial)} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField control={financialForm.control} name="financialYear" render={({ field }) => (
                      <FormItem><FormLabel>Financial Year *</FormLabel><FormControl><Input placeholder="2024-25" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={financialForm.control} name="annualIncome" render={({ field }) => (
                      <FormItem><FormLabel>Annual Income</FormLabel><FormControl><Input type="number" min={0} step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={financialForm.control} name="annualExpenditure" render={({ field }) => (
                      <FormItem><FormLabel>Annual Expenditure</FormLabel><FormControl><Input type="number" min={0} step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={submittingFinancial}>{submittingFinancial ? 'Submitting...' : 'Submit Statement'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowFinancialForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {financialsLoading ? <CardSkeleton /> : (
              financials.length === 0 ? (
                <EmptyState title="No financial statements" description="Submit one record for each financial year." />
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Financial Year</th>
                        <th className="px-4 py-3 text-left font-semibold">Income</th>
                        <th className="px-4 py-3 text-left font-semibold">Expenditure</th>
                        <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {financials.map((financial) => (
                        <tr key={financial.id}>
                          <td className="px-4 py-3 font-medium">{financial.financialYear}</td>
                          <td className="px-4 py-3">{formatInr(financial.annualIncome)}</td>
                          <td className="px-4 py-3">{formatInr(financial.annualExpenditure)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{financial.submittedAt ? new Date(financial.submittedAt).toLocaleDateString('en-IN') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function MemberSection({
  title,
  members,
  onDelete,
  onEdit,
  deleting,
}: {
  title: string
  members: Array<{
    id: number
    fullName: string
    designation?: string
    appointmentDate?: string
    contactNumber?: string
    maskedAadhaar?: string | null
    address?: string
    isVerifiedByDc?: boolean
    dcFlagReason?: string | null
  }>
  onDelete: (memberId: number) => Promise<void>
  onEdit: (memberId: number) => void
  deleting: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-4 py-3 font-semibold">{title}</div>
      {members.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No records available.</div>
      ) : (
        <div className="divide-y divide-border">
          {members.map((member) => (
            <div key={member.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{member.fullName}</p>
                  <p className="text-sm text-muted-foreground">{member.designation ?? '—'}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(member.id)}>Edit</Button>
                  <Button variant="ghost" size="sm" disabled={deleting} onClick={() => void onDelete(member.id)}>Delete</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Appointment:</span> {member.appointmentDate ?? '—'}</div>
                <div><span className="text-muted-foreground">Aadhaar:</span> {member.maskedAadhaar ?? '—'}</div>
                <div><span className="text-muted-foreground">Contact:</span> {member.contactNumber ?? '—'}</div>
                <div><span className="text-muted-foreground">Address:</span> {member.address ?? '—'}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={member.isVerifiedByDc ? 'APPROVED' : member.dcFlagReason ? 'FLAGGED' : 'PENDING'} />
                {member.dcFlagReason && <span className="text-xs text-destructive">{member.dcFlagReason}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
