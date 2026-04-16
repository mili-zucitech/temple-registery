import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useGetTrustByTempleQuery, useCreateTrustMutation, useUpdateTrustMutation, useSubmitTrustForReviewMutation,
  useGetBoardMembersQuery, useAddBoardMemberMutation,
  useListFinancialsQuery, useSubmitFinancialMutation,
  useListBoardMeetingsQuery, useCreateBoardMeetingMutation,
} from '@/features/trust/trustApi'
import {
  createTrustSchema, createBoardMemberSchema, submitTrustFinancialSchema, createBoardMeetingSchema,
  TRUST_TYPES,
  type CreateTrustRequest, type CreateBoardMemberRequest, type SubmitTrustFinancialRequest, type CreateBoardMeetingRequest,
} from '@/features/trust/trustTypes'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { BoardMemberTabs } from '../../components/BoardMemberTabs'

export function TaTrustPage() {
  const [tab, setTab] = useState('details')
  const [page, setPage] = useState(0)

  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  const { data: trustData, isLoading: trustLoading } = useGetTrustByTempleQuery(templeId!, { skip: !templeId })
  const trustList = trustData?.data
  const trust = Array.isArray(trustList) ? trustList[0] : trustList

  const { data: membersData, isLoading: membersLoading } = useGetBoardMembersQuery(
    { trustId: trust?.id!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !trust?.id || tab !== 'board' }
  )
  const { data: financialsData, isLoading: financialsLoading } = useListFinancialsQuery(
    { trustId: trust?.id!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !trust?.id || tab !== 'financials' }
  )
  const { data: meetingsData, isLoading: meetingsLoading } = useListBoardMeetingsQuery(
    { trustId: trust?.id!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !trust?.id || tab !== 'meetings' }
  )

  const [createTrust, { isLoading: creating }] = useCreateTrustMutation()
  const [updateTrust, { isLoading: updating }] = useUpdateTrustMutation()
  const [submitForReview, { isLoading: submittingReview }] = useSubmitTrustForReviewMutation()
  const [addMember, { isLoading: addingMember }] = useAddBoardMemberMutation()
  const [submitFinancial, { isLoading: submittingFinancial }] = useSubmitFinancialMutation()
  const [createMeeting, { isLoading: creatingMeeting }] = useCreateBoardMeetingMutation()

  const [showTrustForm, setShowTrustForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [showFinancialForm, setShowFinancialForm] = useState(false)
  const [showMeetingForm, setShowMeetingForm] = useState(false)

  const trustForm = useForm<CreateTrustRequest>({
    resolver: zodResolver(createTrustSchema) as any,
    mode: 'onChange',
    defaultValues: {
      trustName: trust?.trustName ?? '',
      trustRegistrationNumber: trust?.trustRegistrationNumber ?? '',
      registeringAuthority: trust?.registeringAuthority ?? '',
      trustType: (trust?.trustType as any) ?? 'PUBLIC',
      dateOfRegistration: trust?.dateOfRegistration ?? '',
      trustPANNumber: trust?.trustPANNumber ?? '',
      bankAccountNumber: trust?.bankAccountNumber ?? '',
      bankNameAndBranch: trust?.bankNameAndBranch ?? '',
      annualIncome: trust?.annualIncome ?? ('' as any),
    },
  })

  const memberForm = useForm<CreateBoardMemberRequest>({
    resolver: zodResolver(createBoardMemberSchema),
    defaultValues: { fullName: '', aadhaar: '', designation: '', appointmentDate: '', contactNumber: '', address: '' },
  })

  const financialForm = useForm<SubmitTrustFinancialRequest>({
    resolver: zodResolver(submitTrustFinancialSchema),
    defaultValues: { financialYear: '' },
  })

  const meetingForm = useForm<CreateBoardMeetingRequest>({
    resolver: zodResolver(createBoardMeetingSchema),
    defaultValues: { agenda: '' },
  })

  const onSaveTrust = async (values: CreateTrustRequest) => {
    if (!templeId) return
    const payload = {
      ...values,
      annualIncome: values.annualIncome === '' ? undefined : values.annualIncome
    }
    try {
      if (trust) {
        await updateTrust({ trustId: trust.id, body: payload }).unwrap()
        toast.success('Trust details updated')
      } else {
        await createTrust({ templeId, body: payload }).unwrap()
        toast.success('Trust registered successfully')
      }
      setShowTrustForm(false)
    } catch {
      toast.error('Failed to save trust details')
    }
  }

  const onSubmitForReview = async () => {
    if (!trust?.id) return
    try {
      await submitForReview({ trustId: trust.id }).unwrap()
      toast.success('Trust and board details submitted for DC review')
    } catch {
      toast.error('Failed to submit for review')
    }
  }

  const onAddMember = async (values: CreateBoardMemberRequest) => {
    if (!trust?.id) return
    try {
      await addMember({ trustId: trust.id, body: { ...values } }).unwrap()
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
    try {
      await createMeeting({ trustId: trust.id, body: values }).unwrap()
      toast.success('Board meeting recorded')
      meetingForm.reset()
      setShowMeetingForm(false)
    } catch {
      toast.error('Failed to record board meeting')
    }
  }

  if (trustLoading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trust Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage trust registration, board members, meetings, and financials.</p>
        </div>
        <div className="flex items-center gap-3">
          {trust && !trust.isVerifiedByDc && (
            <Button className="bg-gradient-gold shadow-gold" disabled={submittingReview} onClick={onSubmitForReview}>
              {submittingReview ? 'Submitting…' : 'Submit for DC Review'}
            </Button>
          )}
          {trust && trust.isVerifiedByDc && (
            <span className="text-sm font-medium text-success bg-success/10 px-3 py-1.5 rounded-full">
              ✓ Approved by DC
            </span>
          )}
          {!trust && (
            <Button className="bg-gradient-gold shadow-gold" onClick={() => setShowTrustForm(true)}>
              Register Trust
            </Button>
          )}
        </div>
      </div>

      {!trust && !showTrustForm ? (
        <EmptyState
          title="Trust not registered"
          description="Register your temple's trust to unlock board member and financial management."
          action={{ label: 'Register Trust', onClick: () => setShowTrustForm(true) }}
        />
      ) : (
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(0) }}>
          <TabsList>
            <TabsTrigger value="details">Trust Details</TabsTrigger>
            <TabsTrigger value="board" disabled={!trust}>Board Members</TabsTrigger>
            <TabsTrigger value="meetings" disabled={!trust}>Board Meetings</TabsTrigger>
            <TabsTrigger value="financials" disabled={!trust}>Financials</TabsTrigger>
          </TabsList>

          {/* ── Trust Details ─────────────────────────────────────────────────── */}
          <TabsContent value="details" className="mt-6">
            {trust?.dcFlagReason && !showTrustForm && (
              <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive">
                <h3 className="font-semibold">DC Review Feedback</h3>
                <p className="text-sm mt-1">{trust.dcFlagReason}</p>
              </div>
            )}
            {showTrustForm || !trust ? (
              <Form {...trustForm as any}>
                <form onSubmit={trustForm.handleSubmit(onSaveTrust as any)} className="space-y-4 rounded-lg border border-border bg-card p-6">
                  <h2 className="font-semibold text-foreground">{trust ? 'Edit Trust Details' : 'Register Trust'}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={trustForm.control as any} name="trustName" render={({ field }) => (
                      <FormItem><FormLabel>Trust Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control as any} name="trustType" render={({ field }) => (
                      <FormItem><FormLabel>Trust Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {TRUST_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control as any} name="trustRegistrationNumber" render={({ field }) => (
                      <FormItem><FormLabel>Registration Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control as any} name="dateOfRegistration" render={({ field }) => (
                      <FormItem><FormLabel>Date of Registration *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control as any} name="registeringAuthority" render={({ field }) => (
                      <FormItem><FormLabel>Registering Authority *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control as any} name="trustPANNumber" render={({ field }) => (
                      <FormItem><FormLabel>PAN Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control as any} name="bankAccountNumber" render={({ field }) => (
                      <FormItem><FormLabel>Bank Account Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control as any} name="bankNameAndBranch" render={({ field }) => (
                      <FormItem><FormLabel>Bank Name and Branch *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={trustForm.control as any} name="annualIncome" render={({ field }) => (
                      <FormItem><FormLabel>Annual Income (₹)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} value={field.value ?? ''} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                  </div>
                  {/* Show a summary of all validation errors if form is invalid */}
                  {!trustForm.formState.isValid && trustForm.formState.errors && (
                    <div className="rounded bg-red-50 border border-red-200 text-red-700 px-4 py-2 mb-2">
                      <div className="font-semibold mb-1">Please fix the following errors:</div>
                      <ul className="list-disc list-inside text-sm">
                        {Object.entries(trustForm.formState.errors).map(([field, err]: any) => (
                          <li key={field}>{err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="bg-gradient-gold shadow-gold" disabled={creating || updating || !trustForm.formState.isValid}>
                      {(creating || updating) ? 'Saving…' : trust ? 'Update Trust' : 'Register Trust'}
                    </Button>
                    {trust && <Button type="button" variant="outline" onClick={() => setShowTrustForm(false)}>Cancel</Button>}
                  </div>
                </form>
              </Form>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">{trust.trustName}</h2>
                  <Button variant="outline" size="sm" onClick={() => setShowTrustForm(true)}>Edit</Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{trust.trustType?.replace('_', ' ')}</span></div>
                  <div><span className="text-muted-foreground">Reg. No:</span> <span className="font-medium">{trust.trustRegistrationNumber ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Authority:</span> <span className="font-medium">{trust.registeringAuthority ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{trust.dateOfRegistration ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Bank Account:</span> <span className="font-medium">{trust.bankAccountNumber ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Bank & Branch:</span> <span className="font-medium">{trust.bankNameAndBranch ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">PAN:</span> <span className="font-medium">{trust.trustPANNumber ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Annual Income:</span> <span className="font-medium">{trust.annualIncome != null ? `₹${trust.annualIncome.toLocaleString()}` : '—'}</span></div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Board Members ─────────────────────────────────────────────────── */}
          <TabsContent value="board" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-foreground">Board Members</h2>
              <Button size="sm" onClick={() => setShowMemberForm(true)}>+ Add Member</Button>
            </div>
            {showMemberForm && (
              <Form {...memberForm}>
                <form onSubmit={memberForm.handleSubmit(onAddMember)} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={memberForm.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="aadhaar" render={({ field }) => (
                      <FormItem><FormLabel>Aadhaar Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                      <FormItem><FormLabel>Contact Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="address" render={({ field }) => (
                      <FormItem><FormLabel>Address *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={addingMember}>{addingMember ? 'Adding…' : 'Add Member'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMemberForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {membersLoading ? <CardSkeleton /> : (
              (membersData?.data?.content ?? []).length === 0 ? (
                <EmptyState title="No board members" description="Add board members to this trust." />
              ) : (
                <BoardMemberTabs members={membersData?.data?.content ?? []} />
              )
            )}
         </TabsContent>

          {/* ── Board Meetings ────────────────────────────────────────────────── */}
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
                      <FormItem><FormLabel>Agenda</FormLabel><FormControl><Input placeholder="Meeting agenda summary" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={creatingMeeting}>{creatingMeeting ? 'Saving…' : 'Record Meeting'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMeetingForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {meetingsLoading ? <CardSkeleton /> : (
              (meetingsData?.data?.content ?? []).length === 0 ? (
                <EmptyState title="No meetings recorded" description="Record board meetings to maintain audit trail." />
              ) : (
                <div className="space-y-3">
                  {(meetingsData?.data?.content ?? []).map(m => (
                    <div key={m.id} className="rounded-lg border border-border bg-card p-4 flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{new Date(m.meetingDate).toLocaleDateString()}</p>
                        {m.agenda && <p className="text-sm text-muted-foreground mt-0.5">{m.agenda}</p>}
                      </div>
                      {m.minutesDocumentId && (
                        <span className="text-xs text-info">Minutes attached</span>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </TabsContent>

          {/* ── Financials ────────────────────────────────────────────────────── */}
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
                      <FormItem><FormLabel>Financial Year * (YYYY-YY)</FormLabel><FormControl><Input placeholder="2024-25" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={financialForm.control} name="annualIncome" render={({ field }) => (
                      <FormItem><FormLabel>Annual Income (₹)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={financialForm.control} name="annualExpenditure" render={({ field }) => (
                      <FormItem><FormLabel>Annual Expenditure (₹)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={submittingFinancial}>{submittingFinancial ? 'Submitting…' : 'Submit Statement'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowFinancialForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {financialsLoading ? <CardSkeleton /> : (
              (financialsData?.data?.content ?? []).length === 0 ? (
                <EmptyState title="No financial statements" description="Submit annual financial statements for the trust." />
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Financial Year</th>
                        <th className="px-4 py-3 text-left font-semibold">Income (₹)</th>
                        <th className="px-4 py-3 text-left font-semibold">Expenditure (₹)</th>
                        <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(financialsData?.data?.content ?? []).map(f => (
                        <tr key={f.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{f.financialYear}</td>
                          <td className="px-4 py-3">{f.annualIncome != null ? `₹${f.annualIncome.toLocaleString()}` : '—'}</td>
                          <td className="px-4 py-3">{f.annualExpenditure != null ? `₹${f.annualExpenditure.toLocaleString()}` : '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{f.submittedAt ? new Date(f.submittedAt).toLocaleDateString() : '—'}</td>
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
